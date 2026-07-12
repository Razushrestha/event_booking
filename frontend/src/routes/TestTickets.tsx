import React, { useState } from 'react';
import { registerTicket } from '@/services/ticketServices';

const RegisterTicketForm = () => {
    const [formData, setFormData] = useState({
        eventId: '41bc011f-ac60-45d8-ace8-462b03b3777d',
        email: 'test@example.com',
        number: '9876543210',
        tierName: 'VIP',
        note: 'Excited to attend!',
    });

    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setMessage('Please upload a payment paymentScreenshot.');
            return;
        }

        const data = new FormData();
        data.append('eventId', formData.eventId);
        data.append('email', formData.email);
        data.append('number', formData.number);
        data.append('tierName', formData.tierName);
        data.append('note', formData.note);
        data.append('paymentScreenshot', file); // your backend expects req.file

        try {
            console.log(data);
            const res = await registerTicket(data);
            console.log(res);
            setMessage(`Success: ${res.data.message}`);
        } catch (error: any) {
            console.error(error);
            setMessage(`Error: ${error.response?.data?.message || 'Something went wrong'}`);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <h2>Register Ticket (Test)</h2>
            <form onSubmit={handleSubmit}>
                eventid
                <input
                    type="text"
                    name="eventId"
                    value={formData.eventId}
                    onChange={handleChange}
                    placeholder="Event ID"
                    required
                /><br /><br />
                email
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                /><br /><br />
                number
                <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    required
                /><br /><br />
                tierName
                <input
                    type="text"
                    name="tierName"
                    value={formData.tierName}
                    onChange={handleChange}
                    placeholder="Ticket Category"
                    required
                /><br /><br />

                <input
                    type="text"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Note"
                /><br /><br />

                <input type="file" name="paymentpaymentScreenshot" onChange={handleFileChange} accept="image/*" required /><br /><br />

                <button type="submit">Submit</button>
            </form>
            <p>{message}</p>
        </div>
    );
};

export default RegisterTicketForm;
