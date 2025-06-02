import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const generatePDFFromData = (quotationData, selectedReferences, specialDiscount) => {
  const doc = new jsPDF("p", "mm", "a4")

  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  let currentY = 20

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
    if (currentY + requiredHeight > pageHeight - margin) {
      doc.addPage()
      currentY = margin
      addPageHeader()
      return true
    }
    return false
  }

  const addPageHeader = () => {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("QUOTATION", pageWidth / 2, currentY, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Quotation No: ${quotationData.quotationNo}`, margin, currentY + 10)
    doc.text(`Date: ${quotationData.date}`, pageWidth - margin, currentY + 10, { align: "right" })

    currentY += 20
  }

  addPageHeader()

  const consignorDetails = [
    `Name: ${selectedReferences[0] || "N/A"}`,
    `Address: ${quotationData.consignorAddress}`,
    `Mobile: ${quotationData.consignorMobile.split(",")[0] || "N/A"}`,
    `GSTIN: ${quotationData.consignorGSTIN || "N/A"}`,
    `State Code: ${quotationData.consignorStateCode || "N/A"}`,
  ]

  const consigneeDetails = [
    `Name: ${quotationData.consigneeName}`,
    `Address: ${quotationData.consigneeAddress}`,
    `GSTIN: ${quotationData.consigneeGSTIN || "N/A"}`,
    `State Code: ${quotationData.consigneeStateCode || "N/A"}`,
  ]

  doc.setFont("helvetica", "bold")
  doc.text("Consignor Details", margin, currentY)
  doc.text("Consignee Details", pageWidth / 2 + margin, currentY)
  doc.setFont("helvetica", "normal")
  currentY += 6

  const detailsHeight = Math.max(consignorDetails.length * 5, consigneeDetails.length * 5)

  checkSpace(detailsHeight + 20)

  let consignorY = currentY
  consignorDetails.forEach((line) => {
    const wrappedLines = wrapText(line, pageWidth / 2 - margin * 2)
    wrappedLines.forEach((wrappedLine) => {
      if (consignorY + 5 > pageHeight - margin) {
        doc.addPage()
        consignorY = margin + 20
      }
      doc.text(wrappedLine, margin, consignorY)
      consignorY += 5
    })
  })

  let consigneeY = currentY
  consigneeDetails.forEach((line) => {
    const wrappedLines = wrapText(line, pageWidth / 2 - margin * 2)
    wrappedLines.forEach((wrappedLine) => {
      if (consigneeY + 5 > pageHeight - margin) {
        doc.addPage()
        consigneeY = margin + 20
      }
      doc.text(wrappedLine, pageWidth / 2 + margin, consigneeY)
      consigneeY += 5
    })
  })

  currentY = Math.max(consignorY, consigneeY) + 10

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

  const rowHeight = 10
  const tableHeight = (itemsData.length + 1) * rowHeight

  checkSpace(tableHeight + 50)

  autoTable(doc, {
    startY: currentY,
    head: [
      ["S.No", "Code", "Product Name", "Description", "GST %", "Qty", "Units", "Rate", "Disc %", "Flat Disc", "Amount"],
    ],
    body: itemsData,
    margin: { top: currentY },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 6, halign: "center" },
      1: { cellWidth: 15, halign: "center" },
      2: { cellWidth: "auto" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 8, halign: "center" },
      6: { cellWidth: 10, halign: "center" },
      7: { cellWidth: 12, halign: "right" },
      8: { cellWidth: 10, halign: "center" },
      9: { cellWidth: 12, halign: "right" },
      10: { cellWidth: 15, halign: "right" },
    },
    didDrawPage: (data) => {
      currentY = data.cursor.y
    },
  })

  currentY = doc.lastAutoTable.finalY + 10

  checkSpace(50)

  const summaryItems = [
    { label: "Subtotal:", value: formatCurrency(quotationData.subtotal) },
    { label: "Total Flat Discount:", value: `-${formatCurrency(quotationData.totalFlatDiscount)}` },
    { label: "Taxable Amount:", value: formatCurrency(quotationData.subtotal - quotationData.totalFlatDiscount) },
  ]

  // Add tax items based on IGST or CGST/SGST
  if (quotationData.isIGST) {
    summaryItems.push({ label: `IGST (${quotationData.igstRate}%):`, value: formatCurrency(quotationData.igstAmount) })
  } else {
    summaryItems.push({ label: `CGST (${quotationData.cgstRate}%):`, value: formatCurrency(quotationData.cgstAmount) })
    summaryItems.push({ label: `SGST (${quotationData.sgstRate}%):`, value: formatCurrency(quotationData.sgstAmount) })
  }

  summaryItems.push({ label: "Total:", value: formatCurrency(quotationData.total) })

  doc.setFont("helvetica", "bold")
  doc.text("Financial Summary", margin, currentY)
  doc.setFont("helvetica", "normal")
  currentY += 7

  summaryItems.forEach((item) => {
    checkSpace(7)
    doc.text(item.label, margin, currentY)
    doc.text(item.value, pageWidth - margin - 10, currentY, { align: "right" })
    currentY += 7
  })

  checkSpace(50)

  doc.setFont("helvetica", "bold")
  doc.text("Terms & Conditions", margin, currentY)
  doc.setFont("helvetica", "normal")
  currentY += 7

  const terms = [
    `Validity: ${quotationData.validity}`,
    `Payment Terms: ${quotationData.paymentTerms}`,
    `Delivery: ${quotationData.delivery}`,
    `Freight: ${quotationData.freight}`,
    `Insurance: ${quotationData.insurance}`,
    `Taxes: ${quotationData.taxes}`,
  ]

  terms.forEach((term) => {
    const wrappedLines = wrapText(term, pageWidth - margin * 2)
    wrappedLines.forEach((line) => {
      checkSpace(7)
      doc.text(line, margin, currentY)
      currentY += 7
    })
  })

  // Add Special Offer section if it exists
  if (quotationData.specialOffers && quotationData.specialOffers.filter((offer) => offer.trim()).length > 0) {
    checkSpace(20)

    doc.setFont("helvetica", "bold")
    doc.text("Divine Empire's 10th Anniversary Special Offer", margin, currentY)
    doc.setFont("helvetica", "normal")
    currentY += 7

    quotationData.specialOffers
      .filter((offer) => offer.trim())
      .forEach((offer) => {
        const wrappedLines = wrapText(`• ${offer}`, pageWidth - margin * 2)
        wrappedLines.forEach((line) => {
          checkSpace(7)
          doc.text(line, margin, currentY)
          currentY += 7
        })
      })
  }

  if (quotationData.notes && quotationData.notes.length > 0) {
    checkSpace(20)

    doc.setFont("helvetica", "bold")
    doc.text("Notes", margin, currentY)
    doc.setFont("helvetica", "normal")
    currentY += 7

    quotationData.notes
      .filter((note) => note.trim())
      .forEach((note) => {
        const wrappedLines = wrapText(`• ${note}`, pageWidth - margin * 2)
        wrappedLines.forEach((line) => {
          checkSpace(7)
          doc.text(line, margin, currentY)
          currentY += 7
        })
      })
  }

  checkSpace(50)

  doc.setFont("helvetica", "bold")
  doc.text("Bank Details", margin, currentY)
  doc.setFont("helvetica", "normal")
  currentY += 7

  const bankDetails = [
    `Account No.: ${quotationData.accountNo}`,
    `Bank Name: ${quotationData.bankName}`,
    `Bank Address: ${quotationData.bankAddress}`,
    `IFSC Code: ${quotationData.ifscCode}`,
    `Email: ${quotationData.email}`,
    `Website: ${quotationData.website}`,
    `Company PAN: ${quotationData.pan}`,
  ]

  bankDetails.forEach((detail) => {
    const wrappedLines = wrapText(detail, pageWidth - margin * 2)
    wrappedLines.forEach((line) => {
      checkSpace(7)
      doc.text(line, margin, currentY)
      currentY += 7
    })
  })

  checkSpace(40)

  doc.setFont("helvetica", "bold")
  doc.text("Declaration", margin, currentY)
  doc.setFont("helvetica", "normal")
  currentY += 7

  const declaration = [
    "We declare that this Quotation shows the actual price of the goods described",
    "and that all particulars are true and correct.",
  ]

  declaration.forEach((line) => {
    const wrappedLines = wrapText(line, pageWidth - margin * 2)
    wrappedLines.forEach((wrappedLine) => {
      checkSpace(7)
      doc.text(wrappedLine, margin, currentY)
      currentY += 7
    })
  })

  doc.setFont("helvetica", "bold")
  doc.text(`Prepared By: ${quotationData.preparedBy}`, margin, currentY + 10)

  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: "right" })
  }

  return doc.output("datauristring").split(",")[1]
}
