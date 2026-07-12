const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "NRS",
    }).format(amount)
}

module.exports = { formatCurrency };