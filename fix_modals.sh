#!/bin/bash
# Tribunal
sed -i "s~{viewingRecord.referenceNo}~{viewingRecord.aioArn || viewingRecord.oioRefNo || viewingRecord.referenceNo || '---'}~g" pages/LitigationSuite/Tribunal/*.tsx
sed -i "s~{formatDisplayDate(viewingRecord.orderDate || viewingRecord.issuedDate)}~{formatDisplayDate(viewingRecord.aioDate || viewingRecord.oioDate || viewingRecord.orderDate || viewingRecord.issuedDate)}~g" pages/LitigationSuite/Tribunal/*.tsx
sed -i "s~Notice Ref No</p>~AIO/OIO Ref No</p>~g" pages/LitigationSuite/Tribunal/*.tsx
sed -i "s~Tribunal Ref No</p>~AIO/OIO Ref No</p>~g" pages/LitigationSuite/Tribunal/*.tsx

# High Court
sed -i "s~{viewingRecord.referenceNo}~{viewingRecord.tioRefNo || viewingRecord.referenceNo || '---'}~g" pages/LitigationSuite/HighCourt/*.tsx
sed -i "s~{formatDisplayDate(viewingRecord.orderDate || viewingRecord.issuedDate)}~{formatDisplayDate(viewingRecord.tioDate || viewingRecord.orderDate || viewingRecord.issuedDate)}~g" pages/LitigationSuite/HighCourt/*.tsx
sed -i "s~{formatDisplayDate(viewingRecord.issuedDate)}~{formatDisplayDate(viewingRecord.tioDate || viewingRecord.orderDate || viewingRecord.issuedDate)}~g" pages/LitigationSuite/HighCourt/*.tsx
sed -i "s~Notice Ref No</p>~TIO Ref No</p>~g" pages/LitigationSuite/HighCourt/*.tsx
sed -i "s~Matter Ref</p>~TIO Ref No</p>~g" pages/LitigationSuite/HighCourt/*.tsx
sed -i "s~Outcome Ref</p>~TIO Ref No</p>~g" pages/LitigationSuite/HighCourt/*.tsx
sed -i "s~Notice Date</p>~TIO Date</p>~g" pages/LitigationSuite/HighCourt/*.tsx
