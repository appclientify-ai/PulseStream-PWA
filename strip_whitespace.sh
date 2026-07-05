#!/bin/bash
find pages -name "*.tsx" -type f -exec sed -i 's/whitespace-nowrap//g' {} +
