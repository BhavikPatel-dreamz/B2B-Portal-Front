
import React, { useState, useEffect } from 'react';

interface RegistrationFormProps {
    validation?: any;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function RegistrationForm({ onSuccess, onError, validation, }: RegistrationFormProps) {
    console.log("🚀 ~ RegistrationForm ~ validation:", validation.customerId)
    console.log("🚀 ~ RegistrationForm ~ validation:", validation?.customerStatus)

    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        businessType: '',
        website: '',
        additionalInfo: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [registrationStatus, setRegistrationStatus] =
        useState<'PENDING' | 'APPROVED' | null>(null);

    useEffect(() => {
        if (validation?.customerStatus === 'PENDING') {
            setRegistrationStatus('PENDING');
        }

        if (validation?.customerStatus === 'APPROVED') {
            setRegistrationStatus('APPROVED');
        }
    }, [validation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const currentUrl = new URL(window.location.href);
            const queryParams = currentUrl.searchParams.toString();

            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            if (validation?.customerId) {
                formDataToSend.append("customerId", validation.customerId);
            }

            const response = await fetch(
                `/apps/b2b-portal/api/proxy/registration?${queryParams}`,
                {
                    method: 'POST',
                    body: formDataToSend,
                }
            );

            const result = await response.json();

            if (result.success) {
                // ✅ IMPORTANT: set status
                setRegistrationStatus(result.status || 'PENDING');

                setMessage({
                    type: 'success',
                    text:
                        result.status === 'APPROVED'
                            ? 'Your application has been approved.'
                            : 'Thank you for registering. Your application is under review.'
                });

                setFormData({
                    companyName: '',
                    contactName: '',
                    email: '',
                    phone: '',
                    businessType: '',
                    website: '',
                    additionalInfo: '',

                });

                onSuccess?.();
            } else {
                const errorMsg = result.error || 'An error occurred. Please try again.';
                setMessage({
                    type: 'error',
                    text: errorMsg
                });
                onError?.(errorMsg);
            }
        } catch (error) {
            const errorMsg = 'An error occurred while submitting. Please try again.';
            setMessage({
                type: 'error',
                text: errorMsg
            });
            onError?.(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            maxWidth: '800px',
            margin: '40px auto',
            padding: '0 16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, #1354F9 0%, #427DF1 100%)',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 44 44" fill="none">
                        <path d="M21.9998 18.3333C26.0499 18.3333 29.3332 15.0501 29.3332 11C29.3332 6.94991 26.0499 3.66666 21.9998 3.66666C17.9497 3.66666 14.6665 6.94991 14.6665 11C14.6665 15.0501 17.9497 18.3333 21.9998 18.3333Z" stroke="white" strokeWidth="3.5" />
                        <path d="M36.6666 32.0833C36.6666 36.6392 36.6666 40.3333 21.9999 40.3333C7.33325 40.3333 7.33325 36.6392 7.33325 32.0833C7.33325 27.5275 13.9003 23.8333 21.9999 23.8333C30.0996 23.8333 36.6666 27.5275 36.6666 32.0833Z" stroke="white" strokeWidth="3.5" />
                    </svg>
                </div>
                <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#030917' }}>
                    B2B Registration
                </h1>
                <p style={{ color: '#65748A' }}>
                    Join our wholesale network. Complete the form below to get started.
                </p>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                padding: '32px'
            }}>
                {/* Messages */}
                {message && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${message.type === 'success' ? '#d1fae5' : '#fecaca'}`,
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        textAlign: 'center'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* ✅ UNDER REVIEW MESSAGE */}
                {/* {registrationStatus === 'PENDING' && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1e40af',
                        textAlign: 'center'
                    }}>
                        Your application is currently under review.
                        <br />
                        We’ll notify you once it’s approved.
                    </div>
                )} */}

                {/* ✅ SHOW FORM ONLY IF NOT SUBMITTED */}
                {registrationStatus !== 'PENDING' && (
                    <form onSubmit={handleSubmit}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '24px',
                            marginBottom: '24px'
                        }}>
                            {/* Company Name */}
                            <div>
                                <label htmlFor="companyName" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Company Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    id="companyName"
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="Your company Ltd."
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Contact Name */}
                            <div>
                                <label htmlFor="contactName" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Contact Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    id="contactName"
                                    type="text"
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                    placeholder="John Smith"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label htmlFor="email" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@company.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+90 122 125 1245"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Business Type */}
                            <div>
                                <label htmlFor="businessType" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Business Type <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select
                                    id="businessType"
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'white',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Select Business Type</option>
                                    <option value="retailer">Retailer</option>
                                    <option value="distributor">Distributor</option>
                                    <option value="wholesaler">Wholesaler</option>
                                    <option value="manufacturer">Manufacturer</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Website */}
                            <div>
                                <label htmlFor="website" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Website (optional)
                                </label>
                                <input
                                    id="website"
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="http://yourcompany.com"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div style={{ marginBottom: '24px' }}>
                            <label htmlFor="additionalInfo" style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Additional Information
                            </label>
                            <textarea
                                id="additionalInfo"
                                name="additionalInfo"
                                value={formData.additionalInfo}
                                onChange={handleChange}
                                placeholder="Tell us more about your business"
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: isSubmitting
                                    ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '16px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                            }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                        </button>

                        {/* Terms Text */}
                        <p style={{
                            textAlign: 'center',
                            fontSize: '14px',
                            color: '#6b7280',
                            margin: '16px 0 0',
                            lineHeight: '1.5'
                        }}>
                            By submitting this form, you agree to our terms and conditions. We&apos;ll review your application and get back to you within 2-3 business days.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
