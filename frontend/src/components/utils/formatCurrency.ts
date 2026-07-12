const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "NRS",
    }).format(amount)
}

export default formatCurrency;