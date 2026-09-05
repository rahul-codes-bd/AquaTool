import { describe, it, expect } from 'vitest';
import { TextTools } from '../textTools';
import { CryptoTools } from '../cryptoTools';
import { GeneratorTools } from '../generatorTools';

describe('Phase 5 Utilities & Malformed Input Handling', () => {
  describe('TextTools: JSON & CSV Parsing and Conversion', () => {
    it('converts valid JSON array of objects to CSV', () => {
      const json = JSON.stringify([
        { id: 1, name: 'Alice', role: 'Engineer' },
        { id: 2, name: 'Bob', role: 'Designer' },
      ]);
      const csv = TextTools.jsonToCsv(json);
      expect(csv).toContain('id,name,role');
      expect(csv).toContain('1,Alice,Engineer');
    });

    it('rejects malformed JSON syntax with descriptive error', () => {
      const malformedJson = '{ "name": "Alice", unclosed: ';
      expect(() => TextTools.jsonToCsv(malformedJson)).toThrow(/Malformed JSON/);
    });

    it('rejects non-array JSON inputs for CSV conversion', () => {
      const scalarJson = '"Just a string"';
      expect(() => TextTools.jsonToCsv(scalarJson)).toThrow(/JSON structure must be an array of objects/);
    });

    it('converts valid CSV to JSON array', () => {
      const csv = `name,age,city\n"Alice",30,"San Francisco"\n"Bob",25,"New York"`;
      const jsonStr = TextTools.csvToJson(csv);
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Alice');
      expect(parsed[1].city).toBe('New York');
    });

    it('returns empty JSON array on empty CSV input', () => {
      expect(TextTools.csvToJson('')).toBe('[]');
      expect(TextTools.csvToJson('   \n\n  ')).toBe('[]');
    });
  });

  describe('TextTools: XML Validation & Formatting', () => {
    it('validates well-formed XML', () => {
      const validXml = '<root><user id="1"><name>Alice</name></user></root>';
      const result = TextTools.validateXml(validXml);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('detects malformed XML unclosed tags', () => {
      const malformedXml = '<root><user><name>Alice</name></root>';
      const result = TextTools.validateXml(malformedXml);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('detects malformed XML missing root or syntax errors', () => {
      const invalidXml = 'Not XML at all <<<<<';
      const result = TextTools.validateXml(invalidXml);
      expect(result.isValid).toBe(false);
    });

    it('formats valid XML with clean indentation', () => {
      const compactXml = '<catalog><book id="1"><title>Security</title></book></catalog>';
      const formatted = TextTools.formatXml(compactXml);
      expect(formatted).toContain('\n');
      expect(formatted).toContain('<catalog>');
      expect(formatted).toContain('  <book');
    });

    it('throws error when attempting to format malformed XML', () => {
      const badXml = '<broken><nested>';
      expect(() => TextTools.formatXml(badXml)).toThrow(/Malformed XML/);
    });
  });

  describe('TextTools: Encoding & Sanitization', () => {
    it('encodes and decodes UTF-8 Base64 strings cleanly', () => {
      const text = 'Hello, world! 🌍🚀 UTF-8 characters: ñ, ü, č';
      const encoded = TextTools.textToBase64(text);
      const decoded = TextTools.base64ToText(encoded);
      expect(decoded).toBe(text);
    });

    it('throws error when decoding malformed Base64', () => {
      expect(() => TextTools.base64ToText('This is not base64!@#$%^')).toThrow(/Invalid Base64 sequence/);
    });

    it('encodes and decodes URL components properly', () => {
      const raw = 'search?query=hello world & tag=dev/web';
      const encoded = TextTools.urlEncode(raw);
      expect(encoded).not.toContain(' ');
      const decoded = TextTools.urlDecode(encoded);
      expect(decoded).toBe(raw);
    });

    it('throws error on malformed URL percent encoding', () => {
      expect(() => TextTools.urlDecode('%E0%A4%A')).toThrow(/Malformed URI sequence/);
    });

    it('cleans whitespace, collapses spaces, trims lines, and removes duplicates', () => {
      const text = '  line 1   with   spaces  \n\n\n  line 2  \n  line 1   with   spaces  ';
      const cleaned = TextTools.cleanWhitespace(text, {
        collapseSpaces: true,
        trimLines: true,
        removeEmptyLines: true,
      });
      expect(cleaned).toBe('line 1 with spaces\nline 2\nline 1 with spaces');

      const deduped = TextTools.removeDuplicateLines(cleaned);
      expect(deduped).toBe('line 1 with spaces\nline 2');
    });

    it('converts case formats accurately', () => {
      const input = 'hello world variable';
      expect(TextTools.convertCase(input, 'camel')).toBe('helloWorldVariable');
      expect(TextTools.convertCase(input, 'kebab')).toBe('hello-world-variable');
      expect(TextTools.convertCase(input, 'upper')).toBe('HELLO WORLD VARIABLE');
      expect(TextTools.convertCase(input, 'title')).toBe('Hello World Variable');
    });

    it('sorts lines alphabetically and reverse', () => {
      const lines = 'banana\napple\ncherry';
      expect(TextTools.sortLines(lines, 'asc')).toBe('apple\nbanana\ncherry');
      expect(TextTools.sortLines(lines, 'desc')).toBe('cherry\nbanana\napple');
    });
  });

  describe('CryptoTools: UUID Generation and Validation', () => {
    it('generates valid RFC 4122 v4 UUIDs', () => {
      const uuids = CryptoTools.generateUuids(5);
      expect(uuids).toHaveLength(5);
      for (const id of uuids) {
        const val = CryptoTools.validateUuid(id);
        expect(val.isValid).toBe(true);
        expect(val.version).toBe(4);
      }
    });

    it('identifies valid version 1 UUIDs', () => {
      const v1Uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const val = CryptoTools.validateUuid(v1Uuid);
      expect(val.isValid).toBe(true);
      expect(val.version).toBe(1);
    });

    it('detects malformed UUIDs with bad lengths, invalid characters, or bad segments', () => {
      expect(CryptoTools.validateUuid('not-a-uuid').isValid).toBe(false);
      expect(CryptoTools.validateUuid('12345678-1234-1234-1234-12345678901z').isValid).toBe(false); // invalid hex char 'z'
      expect(CryptoTools.validateUuid('12345678-1234-1234-1234').isValid).toBe(false); // incomplete
      expect(CryptoTools.validateUuid('').isValid).toBe(false);
    });
  });

  describe('CryptoTools: JWT Decoding & Structural Validation', () => {
    it('decodes standard JWT header and payload without verification', () => {
      // Header: {"alg":"HS256","typ":"JWT"}
      // Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const decoded = CryptoTools.decodeJwt(token);
      expect(decoded.header.alg).toBe('HS256');
      expect(decoded.payload.sub).toBe('1234567890');
      expect(decoded.payload.name).toBe('John Doe');
      expect(decoded.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });

    it('throws descriptive error on malformed JWT part count', () => {
      expect(() => CryptoTools.decodeJwt('header.payload')).toThrow(/Invalid JWT structure/);
      expect(() => CryptoTools.decodeJwt('header.payload.signature.extra')).toThrow(/Invalid JWT structure/);
      expect(() => CryptoTools.decodeJwt('')).toThrow(/JWT token is empty/);
    });

    it('throws error when JWT contains malformed Base64 or non-JSON parts', () => {
      expect(() => CryptoTools.decodeJwt('@@@.###.$$$')).toThrow(/Invalid base64url characters/);
      // Valid base64 but not json
      const notJsonB64 = btoa('Not JSON at all');
      expect(() => CryptoTools.decodeJwt(`${notJsonB64}.${notJsonB64}.sig`)).toThrow(/invalid JSON syntax/);
    });
  });

  describe('CryptoTools: Timestamp Parsing & Malformed Handling', () => {
    it('parses valid Unix timestamps in seconds and milliseconds', () => {
      const resSec = CryptoTools.parseTimestamp('1714567890');
      expect(resSec.unixSeconds).toBe(1714567890);
      expect(resSec.isoUtc).toContain('2024-05-01');

      const resMs = CryptoTools.parseTimestamp('1714567890000');
      expect(resMs.unixSeconds).toBe(1714567890);
    });

    it('parses ISO date strings', () => {
      const iso = '2026-05-01T12:00:00Z';
      const res = CryptoTools.parseTimestamp(iso);
      expect(res.isoUtc).toBe('2026-05-01T12:00:00.000Z');
      expect(res.dayOfWeek).toBeDefined();
      expect(res.relativeTime).toBeDefined();
    });

    it('rejects malformed or invalid timestamp strings', () => {
      expect(() => CryptoTools.parseTimestamp('invalid-date-string')).toThrow(/Invalid date or timestamp/);
      expect(() => CryptoTools.parseTimestamp('')).toThrow(/Invalid timestamp: Input is empty/);
    });
  });

  describe('CryptoTools: Color Parser & Converter', () => {
    it('parses 6-digit and 3-digit HEX colors', () => {
      const c6 = CryptoTools.parseColor('#06B6D4');
      expect(c6).not.toBeNull();
      expect(c6?.hex.toLowerCase()).toBe('#06b6d4');
      expect(c6?.r).toBe(6);
      expect(c6?.g).toBe(182);
      expect(c6?.b).toBe(212);

      const c3 = CryptoTools.parseColor('#F00');
      expect(c3?.hex.toLowerCase()).toBe('#ff0000');
      expect(c3?.r).toBe(255);
      expect(c3?.g).toBe(0);
    });

    it('parses rgb() and rgba() CSS strings', () => {
      const rgb = CryptoTools.parseColor('rgb(255, 128, 0)');
      expect(rgb?.r).toBe(255);
      expect(rgb?.g).toBe(128);
      expect(rgb?.b).toBe(0);

      const rgba = CryptoTools.parseColor('rgba(255, 128, 0, 0.8)');
      expect(rgba?.a).toBe(0.8);
      expect(rgba?.rgbaString).toContain('0.8');
    });

    it('parses hsl() CSS strings', () => {
      const hsl = CryptoTools.parseColor('hsl(180, 50%, 50%)');
      expect(hsl?.h).toBe(180);
      expect(hsl?.s).toBe(50);
      expect(hsl?.l).toBe(50);
    });

    it('returns null for malformed color formats', () => {
      expect(CryptoTools.parseColor('not-a-color')).toBeNull();
      expect(CryptoTools.parseColor('#ZZZZZZ')).toBeNull();
      expect(CryptoTools.parseColor('rgb(999, 999, 999)')).toBeNull();
      expect(CryptoTools.parseColor('')).toBeNull();
    });
  });

  describe('GeneratorTools: Regex Tester & Malformed Handling', () => {
    it('finds global matches with capture groups accurately', () => {
      const res = GeneratorTools.testRegex('(\\w+)@([\\w\\.]+)', 'gi', 'Contact support@example.com or admin@test.org');
      expect(res.error).toBeUndefined();
      expect(res.isValid).toBe(true);
      expect(res.matches).toHaveLength(2);
      expect(res.matches[0].match).toBe('support@example.com');
      expect(res.matches[0].groups).toEqual(['support', 'example.com']);
    });

    it('catches and reports syntax errors in malformed regex without crashing', () => {
      const badRegex = '(unclosed group';
      const res = GeneratorTools.testRegex(badRegex, 'g', 'sample text');
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.matches).toHaveLength(0);
    });

    it('catches and reports invalid regex quantifier errors', () => {
      const res = GeneratorTools.testRegex('*invalid quantifier', 'g', 'sample text');
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('GeneratorTools: QR Code Generator Input Validation', () => {
    it('throws error when generating QR code with empty input', async () => {
      await expect(GeneratorTools.generateQrCodeDataUrl('')).rejects.toThrow(/Content cannot be empty/);
      await expect(GeneratorTools.generateQrCodeSvg('   ')).rejects.toThrow(/Content cannot be empty/);
    });
  });
});
