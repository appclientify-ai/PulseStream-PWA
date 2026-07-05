#!/bin/bash
sed -i '/Tax Period<\/p>/a \                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">AIO/OIO Ref No</p><p className="text-base font-black text-slate-900">{viewingRecord.aioArn || viewingRecord.oioRefNo || viewingRecord.referenceNo || "---"}</p></div>' pages/LitigationSuite/Tribunal/TribunalPending.tsx

sed -i '/Tax Period<\/p>/a \                 <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">TIO Ref No</p><p className="text-base font-black text-slate-900">{viewingRecord.tioRefNo || viewingRecord.referenceNo || "---"}</p></div>' pages/LitigationSuite/HighCourt/CourtPending.tsx
