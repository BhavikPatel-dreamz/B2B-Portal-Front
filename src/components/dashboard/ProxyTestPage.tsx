import React, { useState } from 'react';

interface ProxyTestProps {
    proxyUrl: string;
    customerId: string;
    shop: string;
}

interface TestResult {
    success: boolean;
    data?: any;
    error?: string;
    timestamp?: string;
}

export default function ProxyTestPage({ proxyUrl, customerId, shop }: ProxyTestProps) {
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(false);

    const testProxyAPI = async () => {
        setLoading(true);
        setTestResult(null);

        try {
            const apiUrl = `${proxyUrl}/chat-test`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId,
                    shop
                })
            });

            const result = await response.json();
            setTestResult(result);
        } catch (error: any) {
            setTestResult({
                success: false,
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Proxy API Test</h1>
                <p className="text-gray-600">Test the chat data proxy API endpoint</p>
            </div>

            {/* Configuration Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">Configuration</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex">
                        <span className="font-medium text-blue-700 w-32">Proxy URL:</span>
                        <span className="text-blue-900 font-mono">{proxyUrl}</span>
                    </div>
                    <div className="flex">
                        <span className="font-medium text-blue-700 w-32">Customer ID:</span>
                        <span className="text-blue-900 font-mono">{customerId}</span>
                    </div>
                    <div className="flex">
                        <span className="font-medium text-blue-700 w-32">Shop:</span>
                        <span className="text-blue-900 font-mono">{shop}</span>
                    </div>
                    <div className="flex">
                        <span className="font-medium text-blue-700 w-32">API Endpoint:</span>
                        <span className="text-blue-900 font-mono">{proxyUrl}/api/proxy/chat-test</span>
                    </div>
                </div>
            </div>

            {/* Test Button */}
            <div className="mb-6">
                <button
                    onClick={testProxyAPI}
                    disabled={loading}
                    className="bg-[#5866FF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4755DD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading && (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {loading ? 'Testing...' : 'Test Proxy API'}
                </button>
            </div>

            {/* Results */}
            {testResult && (
                <div className={`rounded-lg p-6 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`w-3 h-3 rounded-full ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <h2 className={`text-lg font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                            {testResult.success ? 'Success!' : 'Error'}
                        </h2>
                    </div>

                    {testResult.error && (
                        <div className="mb-4">
                            <p className="text-red-700 font-medium">Error Message:</p>
                            <p className="text-red-600 font-mono text-sm mt-1">{testResult.error}</p>
                        </div>
                    )}

                    {testResult.data && (
                        <div>
                            <h3 className="font-semibold text-green-900 mb-3">Chat Data:</h3>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="text-xs text-gray-600 mb-1">Total Conversations</p>
                                    <p className="text-2xl font-bold text-gray-900">{testResult.data.totalConversations}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="text-xs text-gray-600 mb-1">Unread Messages</p>
                                    <p className="text-2xl font-bold text-blue-600">{testResult.data.unreadTotal}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="text-xs text-gray-600 mb-1">Shop</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">{testResult.data.shop}</p>
                                </div>
                            </div>

                            {/* Conversations List */}
                            {testResult.data.conversations && testResult.data.conversations.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-green-900 mb-2">Conversations:</h4>
                                    <div className="space-y-3">
                                        {testResult.data.conversations.map((conv: any) => (
                                            <div key={conv.id} className="bg-white rounded-lg p-4 border border-green-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h5 className="font-semibold text-gray-900">{conv.subject}</h5>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${conv.status === 'open'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {conv.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{conv.lastMessage}</p>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>{new Date(conv.lastMessageAt).toLocaleString()}</span>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                                                            {conv.unreadCount} unread
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Raw JSON */}
                    <details className="mt-4">
                        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                            View Raw JSON Response
                        </summary>
                        <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                            {JSON.stringify(testResult, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
