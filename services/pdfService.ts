import { BankConfig, BankId, OptimizationResult } from "../types";

declare var pdfMake: any;

export const generatePDF = (
  results: OptimizationResult[],
  banks: Record<BankId, BankConfig>
) => {
  const activeBanks = Object.values(banks).filter(b => b.isActive);
  
  // Define table body dynamically
  const tableBody = [];

  // Header Row
  const headerRow = [
    { text: 'Категория', style: 'tableHeader', alignment: 'left' },
    ...activeBanks.map(bank => ({ 
      text: bank.name, 
      style: 'tableHeader', 
      alignment: 'center',
      fillColor: bank.color.includes('green') ? '#dcfce7' : 
                 bank.color.includes('red') ? '#fee2e2' : 
                 bank.color.includes('yellow') ? '#fef9c3' : 
                 bank.color.includes('blue') ? '#dbeafe' : '#f3f4f6'
    }))
  ];
  tableBody.push(headerRow);

  // Data Rows
  results.forEach(row => {
    // Check if any bank has this category selected or available
    const hasSelection = Object.values(row.bankSelections).some(s => s?.selected);
    if (!hasSelection) return; // Optional: Only show selected categories to save space? Or show all? Let's show all valid options.

    const dataRow = [
      { text: row.categoryName, style: 'cell', bold: true },
      ...activeBanks.map(bank => {
        const selection = row.bankSelections[bank.id];
        if (!selection) {
          return { text: '-', style: 'cell', alignment: 'center', color: '#9ca3af' };
        }
        
        return {
          text: `${selection.percentage}%`,
          style: 'cell',
          alignment: 'center',
          fillColor: selection.selected ? '#bbf7d0' : undefined, // Green background if selected
          bold: selection.selected
        };
      })
    ];
    tableBody.push(dataRow);
  });

  const docDefinition = {
    content: [
      { text: 'Cashback Smart Assistant', style: 'header' },
      { text: `План кэшбэка на: ${new Date().toLocaleDateString('ru-RU')}`, style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', ...activeBanks.map(() => 'auto')], // First col expands, others auto
          body: tableBody
        },
        layout: {
          hLineWidth: (i: number) => 1,
          vLineWidth: (i: number) => 1,
          hLineColor: (i: number) => '#e5e7eb',
          vLineColor: (i: number) => '#e5e7eb',
          paddingLeft: (i: number) => 8,
          paddingRight: (i: number) => 8,
          paddingTop: (i: number) => 8,
          paddingBottom: (i: number) => 8,
        }
      },
      { text: '\n\nСводка по банкам', style: 'header' },
      {
        columns: [
          activeBanks.map(bank => {
            const bankItems = results.filter(r => r.bankSelections[bank.id]?.selected);
            if (bankItems.length === 0) return null;
            
            return {
              stack: [
                { text: bank.name, style: 'bankTitle', margin: [0, 0, 0, 5] },
                {
                  ul: bankItems.map(item => 
                    `${item.categoryName}: ${item.bankSelections[bank.id]!.percentage}%`
                  ),
                  fontSize: 10,
                  color: '#4b5563'
                },
                { text: '\n' }
              ],
              width: 'auto',
              margin: [0, 0, 20, 0]
            };
          }).filter(Boolean)
        ]
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 12,
        alignment: 'center',
        color: 'gray',
        margin: [0, 0, 0, 20]
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'black',
        margin: [0, 2, 0, 2]
      },
      cell: {
        fontSize: 10,
        margin: [0, 2, 0, 2]
      },
      bankTitle: {
          fontSize: 12,
          bold: true,
          decoration: 'underline'
      }
    },
    defaultStyle: {
      font: 'Roboto' // PDFMake usually needs font definitions, relying on CDN provided standard fonts or VFS
    }
  };

  pdfMake.createPdf(docDefinition).download('cashback-matrix.pdf');
};
