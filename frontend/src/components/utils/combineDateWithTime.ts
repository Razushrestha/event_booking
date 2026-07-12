const combineDateWithTime = (date: string, time: string): string => {
    if (!date || !time) return new Date().toISOString()

    const dateObj = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)

    dateObj.setHours(hours, minutes, 0, 0)
    return dateObj.toISOString()
}

export default combineDateWithTime;