import React from 'react';
import { createRoot } from 'react-dom/client';
import { CompanyApp } from './components/CompanyApp';
import { RegistrationForm } from './components/RegistrationForm';
import './styles/tailwind.css';

// Define the config interface
interface EmbedConfig {
    containerId: string;
    shopDomain?: string;
    [key: string]: unknown;
}

// Define the global interface for the init function
declare global {
    interface Window {
        ShopifyCompanyApp: {
            init: (config: EmbedConfig) => Promise<void>;
        };
    }
}

/**
 * Validate if customer is logged in and has B2B access
 * @returns Promise<{isLoggedIn: boolean, hasB2BAccess: boolean, redirectTo?: string}>
 */
async function validateCustomerAccess() {
    console.log('Validating customer access via API...');
    try {
        // Get current URL query parameters to pass to validation API
        const currentUrl = new URL(window.location.href);
        const queryParams = currentUrl.searchParams.toString();

        // Call the validation API endpoint
        const response = await fetch(`/apps/b2b-portal/api/proxy/validate-customer?${queryParams}`);
        const data = await response.json();

        console.log('Customer validation result:', data);
        return data;
    } catch (error) {
        console.error('Error validating customer access:', error);
        return {
            isLoggedIn: false,
            hasB2BAccess: false,
            redirectTo: '/apps/b2b-portal/registration',
            message: 'Error validating access'
        };
    }
}

// Show registration form when customer doesn't have B2B access
function showRegistrationForm(container: HTMLElement, validation: any) {
    // Clear the container and render the RegistrationForm component
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <RegistrationForm validation={validation} />
        </React.StrictMode>
    );
}

window.ShopifyCompanyApp = {
    init: async function (config) {
        const container = document.getElementById(config.containerId);
        if (!container) {
            console.error(`Container ${config.containerId} not found`);
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f4f6;
                        border-top-color: #667eea;
                        border-radius: 50%;
                        margin: 0 auto 12px;
                        animation: spin 1s linear infinite;
                    "></div>
                    <p style="color: #6b7280; font-size: 14px;">Validating access...</p>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;

        // Validate customer access
        const validation = await validateCustomerAccess();
        // Check validation result
        // if (!validation.isLoggedIn) {
        //     console.log('Customer is not logged in - redirecting to login page');
        //     // Redirect to Shopify account login page
        //     window.location.href = '/account/login';
        //     return;
        // }

        if (!validation.hasB2BAccess) {
            console.log('Customer does not have B2B access - showing registration form');
            showRegistrationForm(container, validation);
            return;
        }

        // Customer is logged in and has B2B access - render the dashboard
        console.log('Customer has B2B access - rendering dashboard');

        // Get shop domain from URL parameters
        const currentUrl = new URL(window.location.href);
        const shop = currentUrl.searchParams.get('shop') || config.shopDomain || (config.shop as string) || '';

        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <CompanyApp
                    containerId={config.containerId}
                    proxyUrl="/apps/b2b-portal/api/proxy"
                    customerId={validation.customerId}
                    isAdmin={validation.companyInfo.isAdmin}
                    isMainContact={validation.companyInfo.isMainContact}
                    logo={validation.logo}
                    shop={shop}
                />
            </React.StrictMode>
        );
    }
};

// Auto-initialize the app when the script loads (for development)
if (document.getElementById('shopify-company-app-root')) {
    window.ShopifyCompanyApp.init({
        containerId: 'shopify-company-app-root'
    });
}
