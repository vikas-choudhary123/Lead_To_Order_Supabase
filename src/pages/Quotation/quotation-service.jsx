export const getNextQuotationNumber = async () => {
    const scriptUrl =
      "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec"
  
    try {
      const params = {
        sheetName: "Make Quotation",
        action: "getNextQuotationNumber",
      }
  
      const urlParams = new URLSearchParams()
      for (const key in params) {
        urlParams.append(key, params[key])
      }
  
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams,
      })
  
      const result = await response.json()
  
      if (result.success) {
        return result.nextQuotationNumber
      } else {
        return "IN-NBD-001"
      }
    } catch (error) {
      console.error("Error getting next quotation number:", error)
      return "IN-NBD-001"
    }
  }
  