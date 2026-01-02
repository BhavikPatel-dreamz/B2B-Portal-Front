import NotificationIcon from 'app/Icons/NotificationIcon';
import PaintIcon from 'app/Icons/PaintIcon';
import Profile from 'app/Icons/Profile';
import SecurityIcon from 'app/Icons/SecurityIcon';
import SettingsIcon from 'app/Icons/SettingsIcon';
import ProxyIcon from 'app/Icons/ProxyIcon';
import { useState } from 'react';


const SettingPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    portalName: 'B2B Portal',
    companyName: 'Your Company INC',
    supportEmail: 'Support@company.com',
    defaultCurrency: 'USD ($)',
    autoApprove: true,
    requireApproval: false
  });

  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Admin',
    email: 'Support@company.com',
    phone: '+1 234 567 8900',
    bio: 'Tell Us About Your Self',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    registrationAlerts: true,
    creditWarnings: true,
    productUpdates: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    autoLogout: true,
    sessionDuration: '30 Minutes'
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'Light',
    language: 'English',
    compactMode: true
  });

  const [proxySettings, setProxySettings] = useState({
    enabled: false,
    proxyType: 'HTTP',
    proxyHost: '',
    proxyPort: '',
    requireAuth: false,
    username: '',
    password: '',
    bypassList: '',
    testStatus: ''
  });

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon /> },
    { id: 'profile', label: 'Profile', icon: <Profile /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationIcon /> },
    { id: 'security', label: 'Security', icon: <SecurityIcon /> },
    { id: 'appearance', label: 'Appearance', icon: <PaintIcon /> },
    { id: 'proxy', label: 'Proxy', icon: <ProxyIcon /> }
  ];

  const handleInputChange = (field:any, value:any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', formData);
    alert('Settings saved successfully!');
  };

  const handleProfileUpdate = () => {
    console.log('Updating profile:', profileData);
    alert('Profile updated successfully!');
  };

  const handlePasswordChange = () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    console.log('Changing password');
    alert('Password changed successfully!');
    setProfileData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const handleNotificationToggle = (field: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveNotifications = () => {
    console.log('Saving notification settings:', notificationSettings);
    alert('Notification settings saved successfully!');
  };

  const handleSecurityToggle = (field: keyof typeof securitySettings) => {
    if (field === 'sessionDuration') return;
    setSecuritySettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSecurityChange = (field: keyof typeof securitySettings, value: string) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSecurity = () => {
    console.log('Saving security settings:', securitySettings);
    alert('Security settings saved successfully!');
  };

  const handleAppearanceToggle = (field: keyof typeof appearanceSettings) => {
    if (field === 'theme' || field === 'language') return;
    setAppearanceSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAppearanceChange = (field: keyof typeof appearanceSettings, value: string) => {
    setAppearanceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAppearance = () => {
    console.log('Saving appearance settings:', appearanceSettings);
    alert('Appearance settings saved successfully!');
  };

  const handleProxyToggle = (field: keyof typeof proxySettings) => {
    if (!['enabled', 'requireAuth'].includes(field)) return;
    setProxySettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleProxyChange = (field: keyof typeof proxySettings, value: string) => {
    setProxySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTestProxy = () => {
    console.log('Testing proxy connection:', proxySettings);
    setProxySettings(prev => ({ ...prev, testStatus: 'testing' }));
    
    // Simulate a test
    setTimeout(() => {
      setProxySettings(prev => ({ 
        ...prev, 
        testStatus: proxySettings.enabled && proxySettings.proxyHost ? 'success' : 'failed' 
      }));
    }, 1500);
  };

  const handleSaveProxy = () => {
    console.log('Saving proxy settings:', proxySettings);
    alert('Proxy settings saved successfully!');
  };

  return (
    <div>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-[30px]">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
            <p className="text-[#6B7280] text-sm">Manage your B2B portal configuration and preferences</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
              <SettingsIcon color="#5866FF" />
            </button>
            <button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
              <NotificationIcon color="#5866FF" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#f2f6fa] rounded-lg shadow-sm mb-6 p-2">
          <div className="flex justify-between">
            {tabs.map((tab) => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 justify-center items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${activeTab === tab.id
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600'
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === "general" && (
          <div className="bg-white rounded-[15px] border border-[#E1E7EF] shadow-sm p-5">
            <div className="mb-6">
              <h2 className="text-[23.1px] font-bold text-[#0F1729]">General Settings</h2>
              <p className="text-[#65758B] text-[12.9px] font-normal mt-1">Manage your portal configuration</p>
            </div>

            <div className="space-y-6">
              {/* Row 1: Portal Name and Company Name */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    Portal Name
                  </label>
                  <input
                    type="text"
                    value={formData.portalName}
                    onChange={(e) => handleInputChange('portalName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Support Email and Default Currency */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    Default Currency
                  </label>
                  <input
                    type="text"
                    value={formData.defaultCurrency}
                    onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-xs"
                  />
                </div>
              </div>

              {/* Toggle Settings */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-semibold text-[#000000]">Auto Approve Orders</div>
                    <div className="text-[12px] font-medium text-[#65758B] mt-0.5">Automatically approve orders under $500</div>
                  </div>
                  <button
                    onClick={() => handleInputChange('autoApprove', !formData.autoApprove)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.autoApprove ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.autoApprove ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-semibold text-[#000000]">Require Registration Approval</div>
                    <div className="text-[12px] font-medium text-[#65758B] mt-0.5">All new registrations require admin approval</div>
                  </div>
                  <button
                    onClick={() => handleInputChange('requireApproval', !formData.requireApproval)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.requireApproval ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.requireApproval ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-[#5866FF] text-white font-semibold rounded-md hover:bg-[#4752CC] transition-colors text-[16px]"
                >
                  Save General Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Information Section */}
            <div className="bg-white rounded-[15px] border border-[#E1E7EF] shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-[23px] font-bold text-[#0F1729]">Profile Information</h2>
                <p className="text-[#65758B] text-[13px] mt-1">Update your personal information</p>
              </div>

              <div className="space-y-4">
                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm resize-none"
                  />
                </div>

                {/* Update Button */}
                <div className="pt-2">
                  <button
                    onClick={handleProfileUpdate}
                    className="px-6 py-2.5 bg-[#5866FF] text-white font-semibold rounded-md hover:bg-[#4752CC] transition-colors text-sm"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-lg border border-[#E1E7EF] shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[#0F1729]">Change Password</h2>
                <p className="text-[#65758B] text-sm mt-1">Update your password to keep your account secure</p>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                  />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                  />
                </div>

                {/* Change Password Button */}
                <div className="pt-2">
                  <button
                    onClick={handlePasswordChange}
                    className="px-6 py-2.5 bg-[#5866FF] text-white font-semibold rounded-md hover:bg-[#4752CC] transition-colors text-sm"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white rounded-[15px] border border-[#E1E7EF] shadow-sm p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-[23px] font-bold text-[#0F1729]">Notification Preferences</h2>
                <p className="text-[#65758B] text-[13px] mt-1">Choose how you want to be notified</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Order Notifications */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Order Notifications</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Receive emails for new orders</div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('orderNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.orderNotifications ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.orderNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Registration Alerts */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Registration Alerts</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Get notified of new B2B registrations</div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('registrationAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.registrationAlerts ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.registrationAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Credit Warnings */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Credit Warnings</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Alerts when credit limits are reached</div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('creditWarnings')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.creditWarnings ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.creditWarnings ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Product Updates */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Product Updates</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Newsletter and product announcements</div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('productUpdates')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.productUpdates ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.productUpdates ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveNotifications}
                  className="px-6 py-2.5 bg-[#5866FF] text-white font-semibold rounded-md hover:bg-[#4752CC] transition-colors text-sm"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white rounded-[15px] border border-[#E1E7EF] shadow-sm p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-[23px] font-bold text-[#0F1729]">Security Settings</h2>
                <p className="text-[#65758B] text-[13px] mt-1">Manage your account security preferences</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Two-Factor Authentication</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Add an extra layer of security</div>
                </div>
                <button
                  onClick={() => handleSecurityToggle('twoFactorAuth')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${securitySettings.twoFactorAuth ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Auto Logout */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Auto Logout</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Automatically log out after inactivity</div>
                </div>
                <button
                  onClick={() => handleSecurityToggle('autoLogout')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${securitySettings.autoLogout ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${securitySettings.autoLogout ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Session Duration */}
              <div className="py-3">
                <label className="block text-sm font-semibold text-[#000000] mb-2">
                  Session Duration
                </label>
                <select
                  value={securitySettings.sessionDuration}
                  onChange={(e) => handleSecurityChange('sessionDuration', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm appearance-none cursor-pointer"
                >
                  <option value="15 Minutes">15 Minutes</option>
                  <option value="30 Minutes">30 Minutes</option>
                  <option value="1 Hour">1 Hour</option>
                  <option value="2 Hours">2 Hours</option>
                  <option value="4 Hours">4 Hours</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveSecurity}
                  className="px-6 py-2.5 bg-[#5866FF] text-white font-semibold rounded-md hover:bg-[#4752CC] transition-colors text-sm"
                >
                  Save Security Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="bg-white rounded-[15px] border border-[#E1E7EF] shadow-sm p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-[23px] font-bold text-[#0F1729]">Appearance Settings</h2>
                <p className="text-[#65758B] text-[13px] mt-1">Customize the look and feel of your Portal</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="block text-sm font-semibold text-[#000000] mb-2">
                  Theme
                </label>
                <select
                  value={appearanceSettings.theme}
                  onChange={(e) => handleAppearanceChange('theme', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm appearance-none cursor-pointer"
                >
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-[#000000] mb-2">
                  Language
                </label>
                <select
                  value={appearanceSettings.language}
                  onChange={(e) => handleAppearanceChange('language', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm appearance-none cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Compact Mode</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Reduce Spacing and show more content</div>
                </div>
                <button
                  onClick={() => handleAppearanceToggle('compactMode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appearanceSettings.compactMode ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appearanceSettings.compactMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveAppearance}
                  className="px-6 py-2.5 bg-[#5866FF] text-white font-semibold rounded-md hover:bg-[#4752CC] transition-colors text-sm"
                >
                  Save Appearance Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "proxy" && (
          <div className="bg-white rounded-[15px] border border-[#E1E7EF] shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-[23px] font-bold text-[#0F1729]">Proxy Settings</h2>
              <p className="text-[#65758B] text-[13px] mt-1">Configure proxy server for network connections</p>
            </div>

            <div className="space-y-6">
              {/* Enable Proxy */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="text-sm font-semibold text-[#000000]">Enable Proxy</div>
                  <div className="text-[13px] text-[#65758B] mt-0.5">Use proxy server for network requests</div>
                </div>
                <button
                  onClick={() => handleProxyToggle('enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${proxySettings.enabled ? 'bg-[#5866FF]' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${proxySettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {proxySettings.enabled && (
                <>
                  {/* Proxy Type */}
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">
                      Proxy Type
                    </label>
                    <select
                      value={proxySettings.proxyType}
                      onChange={(e) => handleProxyChange('proxyType', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm appearance-none cursor-pointer"
                    >
                      <option value="HTTP">HTTP</option>
                      <option value="HTTPS">HTTPS</option>
                      <option value="SOCKS4">SOCKS4</option>
                      <option value="SOCKS5">SOCKS5</option>
                    </select>
                  </div>

                  {/* Proxy Host and Port */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#000000] mb-2">
                        Proxy Host
                      </label>
                      <input
                        type="text"
                        value={proxySettings.proxyHost}
                        onChange={(e) => handleProxyChange('proxyHost', e.target.value)}
                        placeholder="proxy.example.com"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#000000] mb-2">
                        Proxy Port
                      </label>
                      <input
                        type="text"
                        value={proxySettings.proxyPort}
                        onChange={(e) => handleProxyChange('proxyPort', e.target.value)}
                        placeholder="8080"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                      />
                    </div>
                  </div>

                  {/* Require Authentication */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="text-sm font-semibold text-[#000000]">Require Authentication</div>
                      <div className="text-[13px] text-[#65758B] mt-0.5">Proxy server requires username and password</div>
                    </div>
                    <button
                      onClick={() => handleProxyToggle('requireAuth')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${proxySettings.requireAuth ? 'bg-[#5866FF]' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${proxySettings.requireAuth ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Authentication Credentials */}
                  {proxySettings.requireAuth && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#000000] mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          value={proxySettings.username}
                          onChange={(e) => handleProxyChange('username', e.target.value)}
                          placeholder="proxy-username"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#000000] mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={proxySettings.password}
                          onChange={(e) => handleProxyChange('password', e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bypass List */}
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">
                      Bypass List
                    </label>
                    <textarea
                      value={proxySettings.bypassList}
                      onChange={(e) => handleProxyChange('bypassList', e.target.value)}
                      placeholder="localhost, 127.0.0.1, *.local"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-[#F1F5F980] text-sm resize-none"
                    />
                    <p className="text-xs text-[#65758B] mt-1">
                      Enter comma-separated list of hosts to bypass proxy
                    </p>
                  </div>

                  {/* Test Connection */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <button
                      onClick={handleTestProxy}
                      disabled={proxySettings.testStatus === 'testing'}
                      className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {proxySettings.testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                    </button>
                    {proxySettings.testStatus === 'success' && (
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Connection successful
                      </span>
                    )}
                    {proxySettings.testStatus === 'failed' && (
                      <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Connection failed
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveProxy}
                  className="px-6 py-2.5 bg-[#5866FF] text-white font-semibold rounded-md hover:bg-[#4752CC] transition-colors text-sm"
                >
                  Save Proxy Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingPage;

