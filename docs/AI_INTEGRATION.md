# AI Integration Guide

## Overview

This document outlines the AI-powered features integrated into the Crime Alert System. The AI components are designed to be modular, scalable, and ethically implemented.

## AI Services Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Main API Server                           │
└───────┬────────────┬────────────┬────────────┬───────────────┘
        │            │            │            │
        │            │            │            │
┌───────▼────┐ ┌────▼─────┐ ┌───▼──────┐ ┌──▼──────────┐
│ Speech-to- │ │  Image   │ │  Report  │ │ Translation │
│    Text    │ │ Analysis │ │Categorize│ │   Service   │
└────────────┘ └──────────┘ └──────────┘ └─────────────┘
```

## 1. Speech-to-Text Service

### Purpose
Convert voice reports to text with support for English, Shona, and Ndebele.

### Implementation Options

#### Option A: Google Cloud Speech-to-Text (Recommended)
**Pros**: High accuracy, multilingual support, reasonable cost
**Cons**: Requires Google Cloud account

```typescript
// services/speech-to-text.service.ts
import speech from '@google-cloud/speech';

export class SpeechToTextService {
  private client: speech.SpeechClient;

  constructor() {
    this.client = new speech.SpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
    });
  }

  async transcribe(
    audioBuffer: Buffer, 
    languageCode: string = 'en-US'
  ): Promise<TranscriptionResult> {
    const audio = {
      content: audioBuffer.toString('base64')
    };

    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: languageCode,
      alternativeLanguageCodes: ['sn-ZW', 'nd-ZW'], // Shona, Ndebele
      enableAutomaticPunctuation: true,
      model: 'default'
    };

    const request = {
      audio: audio,
      config: config
    };

    try {
      const [response] = await this.client.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join('\n');

      return {
        text: transcription || '',
        confidence: response.results?.[0]?.alternatives?.[0]?.confidence || 0,
        language: languageCode
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}
```

#### Option B: OpenAI Whisper (Open Source)
**Pros**: Free, runs locally, open source
**Cons**: Requires more computational resources

```typescript
// Using whisper.cpp or replicate.com
import Replicate from 'replicate';

export class WhisperService {
  private replicate: Replicate;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });
  }

  async transcribe(audioUrl: string): Promise<TranscriptionResult> {
    const output = await this.replicate.run(
      "openai/whisper:v3",
      {
        input: {
          audio: audioUrl,
          model: "large-v3",
          language: "auto",
          translate: false
        }
      }
    );

    return {
      text: output.transcription,
      confidence: 0.95, // Whisper doesn't provide confidence
      language: output.detected_language
    };
  }
}
```

### API Endpoint

```typescript
// routes/ai.routes.ts
router.post('/transcribe', 
  uploadMiddleware.single('audio'),
  async (req, res) => {
    try {
      const audioBuffer = req.file.buffer;
      const language = req.body.language || 'en-US';
      
      const result = await speechToTextService.transcribe(
        audioBuffer, 
        language
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Transcription failed' });
    }
  }
);
```

## 2. Image Analysis Service

### Purpose
Analyze uploaded images for:
- Object detection
- Scene classification
- Explicit content filtering
- Label extraction

### Implementation Options

#### Option A: Google Cloud Vision API (Recommended)
```typescript
import vision from '@google-cloud/vision';

export class ImageAnalysisService {
  private client: vision.ImageAnnotatorClient;

  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
    });
  }

  async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysis> {
    const request = {
      image: { content: imageBuffer.toString('base64') },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'IMAGE_PROPERTIES' }
      ]
    };

    const [result] = await this.client.annotateImage(request);

    return {
      labels: result.labelAnnotations?.map(label => ({
        description: label.description,
        score: label.score
      })) || [],
      objects: result.localizedObjectAnnotations?.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: obj.boundingPoly
      })) || [],
      safeSearch: {
        adult: result.safeSearchAnnotation?.adult,
        violence: result.safeSearchAnnotation?.violence,
        medical: result.safeSearchAnnotation?.medical
      },
      dominantColors: result.imagePropertiesAnnotation?.dominantColors?.colors?.map(c => ({
        red: c.color?.red,
        green: c.color?.green,
        blue: c.color?.blue,
        score: c.score
      })) || []
    };
  }

  async detectWeapons(imageBuffer: Buffer): Promise<boolean> {
    const analysis = await this.analyzeImage(imageBuffer);
    const weaponKeywords = ['weapon', 'gun', 'knife', 'firearm', 'blade'];
    
    return analysis.labels.some(label => 
      weaponKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword)
      ) && label.score > 0.7
    );
  }
}
```

#### Option B: TensorFlow.js (Local Processing)
```typescript
import * as tf from '@tensorflow/tfjs-node';
import * as cocossd from '@tensorflow-models/coco-ssd';

export class LocalImageAnalysis {
  private model: cocossd.ObjectDetection | null = null;

  async initialize() {
    this.model = await cocossd.load();
  }

  async detectObjects(imageBuffer: Buffer): Promise<Detection[]> {
    if (!this.model) await this.initialize();
    
    const tensor = tf.node.decodeImage(imageBuffer);
    const predictions = await this.model!.detect(tensor);
    
    tensor.dispose();
    
    return predictions.map(pred => ({
      class: pred.class,
      confidence: pred.score,
      bbox: pred.bbox
    }));
  }
}
```

## 3. Report Categorization Service

### Purpose
Automatically categorize and prioritize crime reports using NLP.

### Implementation

```typescript
import OpenAI from 'openai';

export class ReportCategorizationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async categorizeReport(description: string): Promise<Categorization> {
    const prompt = `You are a crime classification system for Zimbabwe police.
    
Categories:
- theft: Stealing property
- assault: Physical violence
- vandalism: Property damage
- burglary: Breaking and entering
- robbery: Theft with force/threat
- vehicle_theft: Car/motorcycle theft
- fraud: Financial deception
- drug_related: Drug crimes
- domestic_violence: Family violence
- other: Other incidents

Severity levels: low, medium, high, critical

Analyze this report and return JSON:
{
  "category": "category_name",
  "severity": "severity_level",
  "confidence": 0.95,
  "keywords": ["keyword1", "keyword2"],
  "reasoning": "brief explanation"
}

Report: ${description}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result;
  }

  async prioritizeReport(
    category: string, 
    severity: string, 
    location: string
  ): Promise<Priority> {
    // Priority algorithm
    const priorityScore = this.calculatePriorityScore(
      category, 
      severity, 
      location
    );
    
    if (priorityScore >= 90) return 'critical';
    if (priorityScore >= 70) return 'high';
    if (priorityScore >= 40) return 'medium';
    return 'low';
  }

  private calculatePriorityScore(
    category: string, 
    severity: string, 
    location: string
  ): number {
    let score = 0;
    
    // Severity weight
    const severityWeights = {
      critical: 50,
      high: 35,
      medium: 20,
      low: 10
    };
    score += severityWeights[severity] || 0;
    
    // Category weight
    const urgentCategories = [
      'robbery', 
      'assault', 
      'domestic_violence'
    ];
    if (urgentCategories.includes(category)) {
      score += 30;
    }
    
    // Time-based (recent reports get higher priority)
    score += 20;
    
    return Math.min(score, 100);
  }
}
```

### Alternative: Rule-Based Classification (No API needed)

```typescript
export class RuleBasedCategorization {
  private categoryKeywords = {
    theft: ['stole', 'stolen', 'theft', 'missing', 'took', 'kuba'],
    assault: ['hit', 'beat', 'attack', 'violence', 'kurohwa'],
    vandalism: ['damage', 'broke', 'destroy', 'kuparadza'],
    robbery: ['robbed', 'gunpoint', 'threatened', 'kupamba'],
    // ... more categories
  };

  categorize(description: string): Categorization {
    const text = description.toLowerCase();
    let bestMatch = { category: 'other', score: 0 };
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(kw => text.includes(kw)).length;
      const score = matches / keywords.length;
      
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }
    
    return {
      category: bestMatch.category,
      severity: this.inferSeverity(text),
      confidence: bestMatch.score,
      keywords: this.extractKeywords(text)
    };
  }

  private inferSeverity(text: string): string {
    const criticalWords = ['gun', 'weapon', 'death', 'serious', 'critical'];
    const highWords = ['injured', 'attack', 'threat', 'violence'];
    
    if (criticalWords.some(w => text.includes(w))) return 'critical';
    if (highWords.some(w => text.includes(w))) return 'high';
    return 'medium';
  }
}
```

## 4. Translation Service

### Purpose
Translate reports between English, Shona, and Ndebele.

### Implementation

```typescript
import { Translate } from '@google-cloud/translate/build/src/v2';

export class TranslationService {
  private translate: Translate;

  constructor() {
    this.translate = new Translate({
      keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
    });
  }

  async translateText(
    text: string, 
    targetLanguage: string
  ): Promise<TranslationResult> {
    try {
      const [translation] = await this.translate.translate(
        text, 
        targetLanguage
      );
      
      return {
        translatedText: translation,
        sourceLanguage: 'auto-detected',
        targetLanguage: targetLanguage,
        confidence: 0.95
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  }

  async translateReport(
    report: Report
  ): Promise<MultilingualReport> {
    const [english, shona, ndebele] = await Promise.all([
      this.translateText(report.description, 'en'),
      this.translateText(report.description, 'sn'),
      this.translateText(report.description, 'nd')
    ]);

    return {
      original: report.description,
      originalLanguage: report.language,
      translations: {
        en: english.translatedText,
        sn: shona.translatedText,
        nd: ndebele.translatedText
      }
    };
  }
}
```

## 5. Crime Trend Analysis

### Purpose
Identify patterns and hotspots in crime data.

### Implementation

```typescript
export class TrendAnalysisService {
  async analyzeHotspots(
    startDate: Date, 
    endDate: Date
  ): Promise<Hotspot[]> {
    // Query reports within date range
    const reports = await this.getReportsInDateRange(startDate, endDate);
    
    // Cluster by location
    const clusters = this.clusterByLocation(reports);
    
    // Identify hotspots
    return clusters
      .filter(c => c.count >= 5) // Minimum 5 reports
      .map(c => ({
        center: c.center,
        radius: c.radius,
        reportCount: c.count,
        dominantCategory: c.mostCommonCategory,
        riskLevel: this.calculateRiskLevel(c.count)
      }));
  }

  private clusterByLocation(reports: Report[]): Cluster[] {
    // Simple grid-based clustering (can use DBSCAN for better results)
    const gridSize = 0.01; // ~1km
    const grid = new Map<string, Report[]>();
    
    reports.forEach(report => {
      const gridKey = `${Math.floor(report.latitude / gridSize)},${Math.floor(report.longitude / gridSize)}`;
      if (!grid.has(gridKey)) {
        grid.set(gridKey, []);
      }
      grid.get(gridKey)!.push(report);
    });
    
    return Array.from(grid.entries()).map(([key, reports]) => ({
      center: this.calculateCenter(reports),
      radius: gridSize * 111, // Convert to km
      count: reports.length,
      mostCommonCategory: this.getMostCommon(
        reports.map(r => r.type)
      )
    }));
  }

  async predictTrends(): Promise<Prediction[]> {
    // Time series analysis
    // This would use a ML model in production
    const historical = await this.getHistoricalData();
    
    return [
      {
        category: 'theft',
        trend: 'increasing',
        confidence: 0.78,
        prediction: 'Expected 15% increase next month'
      },
      // ... more predictions
    ];
  }
}
```

## Cost Optimization Strategies

### 1. Caching
```typescript
import Redis from 'ioredis';

export class CachedAIService {
  private redis: Redis;
  
  async getCachedOrAnalyze(
    imageHash: string, 
    analyzer: () => Promise<any>
  ): Promise<any> {
    const cached = await this.redis.get(`analysis:${imageHash}`);
    if (cached) return JSON.parse(cached);
    
    const result = await analyzer();
    await this.redis.setex(
      `analysis:${imageHash}`, 
      86400, // 24 hours
      JSON.stringify(result)
    );
    
    return result;
  }
}
```

### 2. Batch Processing
Process multiple items together to reduce API calls.

### 3. Fallback to Rule-Based
Use AI for complex cases, rule-based for simple ones.

## Ethical Considerations

1. **Bias Mitigation**: Regularly audit AI decisions for demographic bias
2. **Transparency**: Log all AI decisions for review
3. **Human Oversight**: All critical decisions reviewed by officers
4. **Data Privacy**: No personal data sent to external AI services
5. **Explainability**: Provide reasoning for AI classifications

## Testing AI Services

```typescript
describe('SpeechToText', () => {
  it('should transcribe English audio', async () => {
    const audio = fs.readFileSync('test/audio/english.wav');
    const result = await service.transcribe(audio, 'en-US');
    
    expect(result.text).toContain('crime report');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});

describe('ReportCategorization', () => {
  it('should categorize theft correctly', async () => {
    const description = 'Someone stole my phone from the market';
    const result = await service.categorizeReport(description);
    
    expect(result.category).toBe('theft');
    expect(result.severity).toBe('medium');
  });
});
```

## Deployment Considerations

1. **API Keys**: Store securely in environment variables
2. **Rate Limiting**: Implement to avoid exceeding quotas
3. **Error Handling**: Graceful fallbacks when AI services fail
4. **Monitoring**: Track usage and costs
5. **Scaling**: Use queues for async processing

## Recommended Stack for University Project

**For minimal cost**:
- Speech-to-Text: OpenAI Whisper (free, open source)
- Image Analysis: TensorFlow.js COCO-SSD (free, runs locally)
- Categorization: Rule-based + GPT-3.5-turbo (cheap)
- Translation: Google Translate API (pay-as-you-go)

**For best accuracy**:
- All Google Cloud APIs (free tier covers testing)
- OpenAI GPT-4 for complex categorization
- Custom fine-tuned models for Shona/Ndebele
