export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // Looks like YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Try to parse as date object
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  return dateStr;
};
