import DeleteIcon from "app/Icons/DeleteIcon";
import EditIcon from "app/Icons/EditIcon";
import LocationIcon from "app/Icons/LocationIcon";
import NotificationIcon from "app/Icons/NotificationIcon";
import PluseIcon from "app/Icons/PluseIcon";
import SettingsIcon from "app/Icons/SettingsIcon";
import UserCheckIcon from "app/Icons/UserCheckIcon";
import React from "react";

interface Location {
    id: string | number;
    name: string;
    company?: string;
    address: string;
    assignedUsers: number;
}

interface LocationListingProps {
    initialLocations?: Location[];
    companyName?: string;
}

const LocationListing: React.FC<LocationListingProps> = ({ initialLocations, companyName }) => {
    const locations = initialLocations?.map(loc => ({
        ...loc,
        company: companyName || loc.company || "Unknown Company"
    })) || [
            {
                id: 1,
                name: "New York Office",
                company: "Acme Crop",
                address: "123 Broadway, New York, NY 10001",
                assignedUsers: 15,
            },
            {
                id: 2,
                name: "New York Office",
                company: "Acme Crop",
                address: "123 Broadway, New York, NY 10001",
                assignedUsers: 15,
            },
            {
                id: 3,
                name: "New York Office",
                company: "Acme Crop",
                address: "123 Broadway, New York, NY 10001",
                assignedUsers: 15,
            },
        ];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Locations Management</h1>
                    <p className="text-[#6B7280] text-sm">
                        Manage company locations and assignments
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-[#5866FF] hover:bg-[#4e5be6] text-white p-4 rounded-lg flex items-center gap-2 font-medium transition-colors">
                        <PluseIcon /> Add New Location
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
                        <SettingsIcon color="#5866FF" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-[#DDE4FF]">
                        <NotificationIcon color="#5866FF" />
                    </button>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {locations.map((location) => (
                    <div
                        key={location.id}
                        className="border border-[#DDE4FF] rounded-[10px] p-5 "
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-[#2563EB1A] text-blue-600 rounded-lg">
                                <LocationIcon />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-[16px]">{location.name}</h3>
                                <p className="text-[#6F7177] text-xs font-normal">{location.company}</p>
                            </div>
                        </div>

                        <p className="text-[#6F7177] font-semibold text-sm mb-3">{location.address}</p>

                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-4 bg-[#F5F5FF] p-2.5 w-[60%]">
                            <UserCheckIcon />
                            <span>{location.assignedUsers} assigned users</span>
                        </div>

                        <div className="flex justify-between items-center gap-5">
                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#D1D5DB] text-[#4B5563] rounded-md text-sm hover:bg-gray-50 h-10">
                                <EditIcon /> Edit
                            </button>
                            <button className="flex items-center justify-center p-2 border border-[#D1D5DB] text-red-500 rounded-md hover:bg-red-50 h-10 w-10">
                                <DeleteIcon />
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocationListing;
