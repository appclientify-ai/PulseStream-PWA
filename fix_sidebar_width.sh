#!/bin/bash
sed -i -E "s/ml-\[22rem\]/ml-72/g" pages/Primary/Dashboard.tsx
sed -i -E "s/w-80/w-72/g" components/Sidebar.tsx
sed -i -E "s/left-80/left-72/g" components/Sidebar.tsx
