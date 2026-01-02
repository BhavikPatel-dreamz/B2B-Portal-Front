interface PageProps {
    customerId: string;
    shop: string;
    proxyUrl: string;
}

const SettingsPage = ({ customerId, shop, proxyUrl }: PageProps) => {
    return (
        <div>
            <header className="bg-white border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                            Settings & Admin Controls
                        </h1>
                        <p className="text-[#6B7280] text-sm">
                            Configure your account and preferences
                        </p>
                    </div>
                </div>
            </header>
            <div className="bg-white rounded-xl shadow-sm border border-[#DDE4FF] p-12 text-center">
                <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings & Admin Controls</h2>
                    <p className="text-gray-600 mb-4">
                        This feature is coming soon to the embedded dashboard. You can access the full settings through the main portal.
                    </p>
                    <p className="text-sm text-gray-500">
                        Customer ID: {customerId}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
