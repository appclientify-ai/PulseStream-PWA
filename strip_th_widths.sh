#!/bin/bash
find pages -name "*.tsx" -type f -exec sed -i -E 's/ w-\[[0-9]+px\]//g' {} +
