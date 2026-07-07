const fs = require('fs');

const file1 = 'pages/ClientHub/GstMasterPortfolio.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(/[\s\S]*?const GstMasterPortfolio: React\.FC/, `import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatDate } from '../../exportUtils';
import { Client, GstStatus, ClientStatus } from '../../types.ts';
import { api } from '../../services/api.ts';
import GSTClientFormModal from '../Clientform/GSTClientFormModal.tsx';
import GSTViewIcon from '../../components/GSTViewIcon';
import { toast } from 'sonner';

interface GstMasterPortfolioProps {
  externalSearch?: string;
  onDataChange?: () => void;
}

const GstMasterPortfolio: React.FC`);

fs.writeFileSync(file1, content1);

const file2 = 'pages/ClientHub/ItMasterPortfolio.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(/[\s\S]*?const ItMasterPortfolio: React\.FC/, `import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatDate } from '../../exportUtils';
import { Client, ClientStatus } from '../../types';
import { api } from '../../services/api.ts';
import ITClientFormModal from '../Clientform/ITClientFormModal';
import ITViewIcon from '../../components/ITViewIcon';
import GSTViewIcon from '../../components/GSTViewIcon';

interface ItMasterPortfolioProps {
  externalSearch?: string;
  onDataChange?: () => void;
}

const ItMasterPortfolio: React.FC`);

fs.writeFileSync(file2, content2);
console.log("Fixed!");
