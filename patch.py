import re
with open('pages/Primary/Dashboard.tsx', 'r') as f:
    c = f.read()

pattern = r"    useEffect\(\(\) => \{\s*const loadFilingData = async \(\) => \{\s*(.*?)\s*\};\s*loadFilingData\(\);\s*\}, \[\]\);"
match = re.search(pattern, c, re.DOTALL)
if match:
    body = match.group(1)
    rep = f"  const loadFilingData = async () => {{\n{body}\n  }};\n  useEffect(() => {{ loadFilingData(); }}, []);"
    c = c.replace(match.group(0), rep)
    
    # Update syncHandler to also call loadFilingData()
    c = c.replace("loadData(true);", "loadData(true); loadFilingData();")
    
    with open('pages/Primary/Dashboard.tsx', 'w') as f:
        f.write(c)
    print("Success")
else:
    print("Fail")
