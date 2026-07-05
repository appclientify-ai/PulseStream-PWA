#!/bin/bash
find pages -name "*.tsx" -type f -exec sed -i -E 's/min-w-\[[0-9]+px\]/min-w-full/g' {} +
# find pages -name "*.tsx" -type f -exec sed -i -E 's/ w-\[[0-9]+px\]//g' {} +
