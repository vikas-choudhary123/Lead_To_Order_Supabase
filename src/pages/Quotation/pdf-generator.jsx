import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const generatePDFFromData = (quotationData, selectedReferences, specialDiscount) => {
  // Change orientation to 'landscape'
  const doc = new jsPDF("l", "mm", "a4") // 'l' for landscape

  const pageWidth = 297 // A4 Landscape width
  const pageHeight = 210 // A4 Landscape height
  const margin = 15 // Adjusted margin for landscape
  let currentY = 15 // Adjusted starting Y for landscape

  // Professional color palette - Refined for a cleaner look
  const colors = {
    primary: [28, 48, 80], // Dark Blue (more professional)
    secondary: [90, 120, 150], // Muted Blue
    accent: [200, 50, 50], // Muted Red for highlights
    success: [40, 140, 80], // Pleasant Green
    background: {
      light: [250, 250, 250], // Off-White
      blue: [235, 245, 255], // Very Light Blue
      green: [240, 255, 240], // Very Light Green
      yellow: [255, 255, 220], // Pale Yellow
    },
    text: {
      primary: [40, 40, 40], // Dark Gray
      secondary: [90, 90, 90], // Medium Gray
      muted: [150, 150, 150], // Light Gray
    },
    border: {
      primary: [180, 180, 180], // Medium Light Gray
      secondary: [220, 220, 220], // Very Light Gray
      accent: [150, 180, 210], // Light Steel Blue
    }
  }

  const wrapText = (text, maxWidth) => {
    return doc.splitTextToSize(text || "", maxWidth)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace("₹", "")
      .trim()
  }

  const checkSpace = (requiredHeight) => {
    if (currentY + requiredHeight > pageHeight - margin - 20) {
      doc.addPage()
      currentY = margin + 10 // Reset Y for new page in landscape
      return true
    }
    return false
  }

  const addDecorative = () => {
    doc.setFillColor(...colors.primary)
    doc.rect(0, 0, pageWidth, 5, "F")
    doc.setFillColor(...colors.accent)
    doc.rect(0, 5, pageWidth, 2, "F")
  }

  const addPageHeader = () => {
    addDecorative()

    currentY = margin + 5

    doc.setFillColor(...colors.accent)
    doc.rect(margin, currentY, 15, 15, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("DE", margin + 7.5, currentY + 9, { align: "center" })

    doc.setTextColor(...colors.primary)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("DIVINE EMPIRE INDIA PVT. LTD.", pageWidth / 2, currentY + 5, { align: "center" })

    doc.setFontSize(10)
    doc.setTextColor(...colors.text.secondary)
    doc.setFont("helvetica", "normal")
    doc.text("Professional Business Solutions", pageWidth / 2, currentY + 13, { align: "center" })

    currentY += 25

    doc.setFillColor(...colors.background.blue)
    doc.setDrawColor(...colors.border.accent)
    doc.setLineWidth(0.5)
    doc.rect(margin, currentY, pageWidth - 2 * margin, 10, "F")
    doc.rect(margin, currentY, pageWidth - 2 * margin, 10)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...colors.primary)
    doc.text(`Quotation No: ${quotationData.quotationNo}`, margin + 5, currentY + 6)
    doc.text(`Date: ${quotationData.date}`, pageWidth - margin - 5, currentY + 6, { align: "right" })

    currentY += 18
  }

  addPageHeader()

  // Fixed consignor/consignee details with proper height calculation
  const consignorDetails = [
    `Name: ${selectedReferences[0] || "N/A"}`,
    `Address: ${quotationData.consignorAddress}`,
    `Mobile: ${quotationData.consignorMobile?.split(",")[0] || "N/A"}`,
    `GSTIN: ${quotationData.consignorGSTIN || "N/A"}`,
    `State Code: ${quotationData.consignorStateCode || "N/A"}`,
  ]

  const consigneeDetails = [
    `Name: ${quotationData.consigneeName}`,
    `Address: ${quotationData.consigneeAddress}`,
    `Contact: ${quotationData.consigneeContactName || "N/A"}`,
    `Mobile: ${quotationData.consigneeContactNo || "N/A"}`,
    `GSTIN: ${quotationData.consigneeGSTIN || "N/A"}`,
    `State Code: ${quotationData.consigneeStateCode || "N/A"}`,
  ]

  const boxWidth = (pageWidth - 3 * margin) / 2
  const cardPadding = 6
  const lineHeight = 4.5

  // Calculate required height for each box
  const calculateBoxHeight = (details) => {
    let totalHeight = 8 + 8 + cardPadding // Header + top padding + bottom padding
    details.forEach(line => {
      const wrappedLines = wrapText(line, boxWidth - 2 * cardPadding)
      totalHeight += wrappedLines.length * lineHeight
    })
    return Math.max(totalHeight, 50) // Minimum height of 50mm
  }

  const consignorHeight = calculateBoxHeight(consignorDetails)
  const consigneeHeight = calculateBoxHeight(consigneeDetails)
  const boxHeight = Math.max(consignorHeight, consigneeHeight) // Use same height for both boxes

  // Draw consignor box
  doc.setFillColor(...colors.background.light)
  doc.setDrawColor(...colors.border.primary)
  doc.setLineWidth(0.6)
  doc.rect(margin, currentY, boxWidth, boxHeight, "FD")

  // Draw consignee box
  doc.rect(margin + boxWidth + margin, currentY, boxWidth, boxHeight, "FD")

  // Draw headers
  doc.setFillColor(...colors.primary)
  doc.rect(margin, currentY, boxWidth, 8, "F")
  doc.rect(margin + boxWidth + margin, currentY, boxWidth, 8, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text("FROM (CONSIGNOR)", margin + boxWidth/2, currentY + 5, { align: "center" })
  doc.text("TO (CONSIGNEE)", margin + boxWidth + margin + boxWidth/2, currentY + 5, { align: "center" })

  // Add consignor details
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...colors.text.primary)

  let consignorY = currentY + 8 + cardPadding
  consignorDetails.forEach((line) => {
    const wrappedLines = wrapText(line, boxWidth - 2 * cardPadding)
    wrappedLines.forEach((wrappedLine) => {
      doc.text(wrappedLine, margin + cardPadding, consignorY)
      consignorY += lineHeight
    })
  })

  // Add consignee details
  let consigneeY = currentY + 8 + cardPadding
  consigneeDetails.forEach((line) => {
    const wrappedLines = wrapText(line, boxWidth - 2 * cardPadding)
    wrappedLines.forEach((wrappedLine) => {
      doc.text(wrappedLine, margin + boxWidth + margin + cardPadding, consigneeY)
      consigneeY += lineHeight
    })
  })

  currentY += boxHeight + 15

  const itemsData = quotationData.items.map((item, index) => [
    index + 1,
    item.code,
    item.name,
    item.description,
    `${item.gst}%`,
    item.qty,
    item.units,
    formatCurrency(item.rate),
    `${item.discount}%`,
    formatCurrency(item.flatDiscount),
    formatCurrency(item.amount),
  ])

  doc.setFillColor(...colors.background.blue)
  doc.rect(margin, currentY - 5, pageWidth - 2 * margin, 10, "F")
  doc.setDrawColor(...colors.border.accent)
  doc.setLineWidth(0.5)
  doc.rect(margin, currentY - 5, pageWidth - 2 * margin, 10)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...colors.primary)
  doc.text("ITEM DETAILS", margin + 5, currentY + 1)

  currentY += 8

  // Calculate available width for the table
  const availableTableWidth = pageWidth - 2 * margin;
  // Distribute column widths to fit perfectly in landscape
  // Total width: 297mm - 2*15mm = 267mm

  autoTable(doc, {
    startY: currentY,
    head: [["S.No", "Code", "Product Name", "Description", "GST %", "Qty", "Units", "Rate", "Disc %", "Flat Disc", "Amount"]],
    body: itemsData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      lineColor: colors.border.secondary,
      lineWidth: 0.3,
      textColor: colors.text.primary,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 4,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: colors.background.light,
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'center' }, // S.No
      1: { cellWidth: 'auto', halign: 'center' }, // Code
      2: { cellWidth: 'auto', fontStyle: 'bold' }, // Product Name
      3: { cellWidth: 'auto' }, // Description (largest)
      4: { cellWidth: 'auto', halign: 'center' }, // GST %
      5: { cellWidth: 'auto', halign: 'center' }, // Qty
      6: { cellWidth: 'auto', halign: 'center' }, // Units
      7: { cellWidth: 'auto', halign: 'right' }, // Rate
      8: { cellWidth: 'auto', halign: 'center' }, // Disc %
      9: { cellWidth: 'auto', halign: 'right' }, // Flat Disc
      10: {
        cellWidth: 'auto', // Amount
        halign: 'right',
        fontStyle: 'bold',
        fillColor: colors.background.green,
        textColor: colors.success,
      },
    },
    didParseCell: function(data) {
      // Center-align header text for specific columns if needed (already in headStyles)
    },
    didDrawPage: (data) => {
      currentY = data.cursor.y;
    },
  });
  

  currentY = doc.lastAutoTable.finalY + 15

  checkSpace(80)

  const summaryBoxWidth = 80
  const summaryBoxHeight = 60
  const summaryX = pageWidth - margin - summaryBoxWidth

  doc.setFillColor(...colors.background.light)
  doc.setDrawColor(...colors.border.primary)
  doc.setLineWidth(0.8)
  doc.rect(summaryX, currentY, summaryBoxWidth, summaryBoxHeight, "FD")

  doc.setFillColor(...colors.primary)
  doc.rect(summaryX, currentY, summaryBoxWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("FINANCIAL SUMMARY", summaryX + summaryBoxWidth / 2, currentY + 5, { align: "center" })

  const summaryItems = [
    { label: "Subtotal:", value: formatCurrency(quotationData.subtotal), color: colors.text.primary },
    { label: "Total Flat Discount:", value: `-${formatCurrency(quotationData.totalFlatDiscount)}`, color: colors.accent },
    { label: "Taxable Amount:", value: formatCurrency(quotationData.subtotal - quotationData.totalFlatDiscount), color: colors.text.primary },
  ]

  if (quotationData.isIGST) {
    summaryItems.push({
      label: `IGST (${quotationData.igstRate}%):`,
      value: formatCurrency(quotationData.igstAmount),
      color: colors.secondary
    })
  } else {
    summaryItems.push({
      label: `CGST (${quotationData.cgstRate}%):`,
      value: formatCurrency(quotationData.cgstAmount),
      color: colors.secondary
    })
    summaryItems.push({
      label: `SGST (${quotationData.sgstRate}%):`,
      value: formatCurrency(quotationData.sgstAmount),
      color: colors.secondary
    })
  }

  summaryItems.push({
    label: "TOTAL AMOUNT:",
    value: formatCurrency(quotationData.total),
    color: colors.success,
    bold: true
  })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  let summaryY = currentY + 12

  summaryItems.forEach((item, index) => {
    if (item.bold || index === summaryItems.length - 1) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9.5)
      doc.setFillColor(...colors.background.green)
      doc.rect(summaryX + 2, summaryY - 3, summaryBoxWidth - 4, 7, "F")
    } else {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
    }

    doc.setTextColor(...item.color)
    doc.text(item.label, summaryX + 4, summaryY)
    doc.text(item.value, summaryX + summaryBoxWidth - 4, summaryY, { align: "right" })
    summaryY += 6.5
  })

  currentY = Math.max(currentY + summaryBoxHeight + 10, summaryY + 10)

  const addSectionHeader = (title, icon = "■") => {
    doc.setFillColor(...colors.background.blue)
    doc.rect(margin, currentY - 3, pageWidth - 2 * margin, 8, "F")
    doc.setDrawColor(...colors.border.accent)
    doc.setLineWidth(0.4)
    doc.rect(margin, currentY - 3, pageWidth - 2 * margin, 8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...colors.primary)
    doc.text(`${icon} ${title}`, margin + 5, currentY + 2)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(...colors.text.secondary)
    currentY += 12
  }

  addSectionHeader("TERMS & CONDITIONS", "")

  doc.setFillColor(...colors.background.light)
  // Add proper spacing after the section header
  const termsContentY = currentY + 3 // Added 3mm space from the section header
  let maxTermsHeight = 0

  const terms = [
    { label: "Validity", value: quotationData.validity },
    { label: "Payment Terms", value: quotationData.paymentTerms },
    { label: "Delivery", value: quotationData.delivery },
    { label: "Freight", value: quotationData.freight },
    { label: "Insurance", value: quotationData.insurance },
    { label: "Taxes", value: quotationData.taxes },
  ]

  // Reset currentY to termsContentY + padding for content
  currentY = termsContentY + 4 // 4mm padding from top border

  terms.forEach((term) => {
    doc.setTextColor(...colors.text.primary)
    doc.setFont("helvetica", "normal")
    const text = `${term.label}: ${term.value}`
    const wrappedLines = wrapText(text, pageWidth - 2 * margin - 20)
    wrappedLines.forEach((line) => {
      doc.text(line, margin + 10, currentY)
      currentY += 4.5
    })
    maxTermsHeight = Math.max(maxTermsHeight, currentY - termsContentY)
  })

  // Draw the border around terms & conditions with proper spacing
  doc.setDrawColor(...colors.border.secondary)
  doc.setLineWidth(0.3)
  doc.rect(margin + 5, termsContentY - 2, pageWidth - 2 * margin - 10, maxTermsHeight + 6, "S") // Added 6mm total padding (3 top + 3 bottom)

  currentY += 5

  if (quotationData.specialOffers && quotationData.specialOffers.filter((offer) => offer.trim()).length > 0) {
    checkSpace(30)
    addSectionHeader("DIVINE EMPIRE'S 10TH ANNIVERSARY SPECIAL OFFER", "")

    doc.setFillColor(...colors.background.yellow)
    const offersContentY = currentY
    let maxOffersHeight = 0
    quotationData.specialOffers
      .filter((offer) => offer.trim())
      .forEach((offer) => {
        doc.setTextColor(...colors.accent)
        doc.setFont("helvetica", "bold")
        const text = `★ ${offer}`
        const wrappedLines = wrapText(text, pageWidth - 2 * margin - 20)
        wrappedLines.forEach((line) => {
          doc.text(line, margin + 10, currentY)
          currentY += 5
        })
        maxOffersHeight = Math.max(maxOffersHeight, currentY - offersContentY)
      })

    doc.setDrawColor(...colors.accent)
    doc.setLineWidth(0.6)
    doc.rect(margin + 5, offersContentY - 2, pageWidth - 2 * margin - 10, maxOffersHeight + 4, "S")

    currentY += 5
  }

  if (quotationData.notes && quotationData.notes.length > 0) {
    checkSpace(30)
    addSectionHeader("ADDITIONAL NOTES", "")

    doc.setFillColor(...colors.background.light)
    const notesContentY = currentY
    let maxNotesHeight = 0
    quotationData.notes
      .filter((note) => note.trim())
      .forEach((note) => {
        doc.setTextColor(...colors.text.primary)
        doc.setFont("helvetica", "normal")
        const text = `• ${note}`
        const wrappedLines = wrapText(text, pageWidth - 2 * margin - 20)
        wrappedLines.forEach((line) => {
          doc.text(line, margin + 10, currentY)
          currentY += 5
        })
        maxNotesHeight = Math.max(maxNotesHeight, currentY - notesContentY)
      })

    doc.setDrawColor(...colors.border.secondary)
    doc.setLineWidth(0.3)
    doc.rect(margin + 5, notesContentY - 2, pageWidth - 2 * margin - 10, maxNotesHeight + 4, "S")

    currentY += 5
  }

  checkSpace(60)

  addSectionHeader("BANK DETAILS", "")

  doc.setFillColor(...colors.background.green)
  // Add proper spacing after the section header
  const bankContentY = currentY + 3 // Added 3mm space from the section header
  let maxBankHeight = 0

  const bankDetails = [
    { label: "Account No.", value: quotationData.accountNo },
    { label: "Bank Name", value: quotationData.bankName },
    { label: "Bank Address", value: quotationData.bankAddress },
    { label: "IFSC Code", value: quotationData.ifscCode },
    { label: "Email", value: quotationData.email },
    { label: "Website", value: quotationData.website },
    { label: "Company PAN", value: quotationData.pan },
  ]

  // Reset currentY to bankContentY + padding for content
  currentY = bankContentY + 4 // 4mm padding from top border

  bankDetails.forEach((detail) => {
    doc.setTextColor(...colors.primary)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(`${detail.label}:`, margin + 10, currentY)
    doc.setTextColor(...colors.text.secondary)
    doc.setFont("helvetica", "normal")
    const wrappedValue = wrapText(detail.value, (pageWidth - 2 * margin - 20) * 0.7)
    wrappedValue.forEach((line) => {
        doc.text(line, margin + 50, currentY)
        currentY += 4.5
    })
    maxBankHeight = Math.max(maxBankHeight, currentY - bankContentY)
  })

  // Draw the border around bank details with proper spacing
  doc.setDrawColor(...colors.success)
  doc.setLineWidth(0.5)
  doc.rect(margin + 5, bankContentY - 2, pageWidth - 2 * margin - 10, maxBankHeight + 6, "S") // Added 6mm total padding (3 top + 3 bottom)

  currentY += 10
  checkSpace(50)

  addSectionHeader("DECLARATION", "")

  doc.setFillColor(255, 255, 255)
  // Add proper spacing after the section header
  const declarationContentY = currentY + 3 // Added 3mm space from the section header
  let maxDeclarationHeight = 0
  const declaration = [
    "We declare that this Quotation shows the actual price of the goods described",
    "and that all particulars are true and correct.",
  ]

  // Reset currentY to declarationContentY + padding for content
  currentY = declarationContentY + 4 // 4mm padding from top border

  doc.setTextColor(...colors.text.primary)
  doc.setFont("helvetica", "normal")
  declaration.forEach((line) => {
    const wrappedLines = wrapText(line, pageWidth - 2 * margin - 20)
    wrappedLines.forEach((wrappedLine) => {
        doc.text(wrappedLine, margin + 10, currentY)
        currentY += 5
    })
    maxDeclarationHeight = Math.max(maxDeclarationHeight, currentY - declarationContentY)
  })

  // Draw the border around declaration with proper spacing
  doc.setDrawColor(...colors.border.primary)
  doc.setLineWidth(0.5)
  doc.rect(margin + 5, declarationContentY - 2, pageWidth - 2 * margin - 10, maxDeclarationHeight + 6, "S") // Added 6mm total padding (3 top + 3 bottom)

  currentY += 15

  doc.setFillColor(...colors.background.blue)
  doc.setDrawColor(...colors.border.accent)
  doc.setLineWidth(0.8)
  doc.rect(margin, currentY, pageWidth - 2 * margin, 20, "FD")

  doc.setDrawColor(...colors.text.muted)
  doc.setLineWidth(0.4)
  doc.line(pageWidth - margin - 80, currentY + 12, pageWidth - margin - 10, currentY + 12)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...colors.primary)
  doc.text(`Prepared By: ${quotationData.preparedBy}`, margin + 10, currentY + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...colors.text.secondary)
  doc.text("Authorized Signatory", pageWidth - margin - 45, currentY + 16, { align: "center" })

  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    doc.setFillColor(...colors.background.light)
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F") // Adjusted footer height for landscape

    doc.setDrawColor(...colors.border.secondary)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    doc.setFontSize(7.5)
    doc.setTextColor(...colors.text.muted)
    doc.setFont("helvetica", "normal")

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: "right" })

    doc.text("Generated by Divine Empire Professional Quotation System", margin, pageHeight - 10)
    doc.text("This is a computer-generated document", margin, pageHeight - 4)

    const now = new Date()
    doc.text(`Generated on: ${now.toLocaleString()}`, pageWidth - margin, pageHeight - 10, { align: "right" })
  }

  return doc.output("datauristring").split(",")[1]
}