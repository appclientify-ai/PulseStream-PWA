#!/bin/bash
sed -i "s~(r.referenceNo || '').toLowerCase().includes(s)~((r.aioArn || r.oioRefNo || r.referenceNo || '').toLowerCase().includes(s))~g" pages/LitigationSuite/Tribunal/*.tsx
sed -i "s~(rec.referenceNo || '').toLowerCase().includes(s)~((rec.aioArn || rec.oioRefNo || rec.referenceNo || '').toLowerCase().includes(s))~g" pages/LitigationSuite/Tribunal/*.tsx

sed -i "s~(r.referenceNo || '').toLowerCase().includes(s)~((r.tioRefNo || r.referenceNo || '').toLowerCase().includes(s))~g" pages/LitigationSuite/HighCourt/*.tsx
sed -i "s~(rec.referenceNo || '').toLowerCase().includes(s)~((rec.tioRefNo || rec.referenceNo || '').toLowerCase().includes(s))~g" pages/LitigationSuite/HighCourt/*.tsx
