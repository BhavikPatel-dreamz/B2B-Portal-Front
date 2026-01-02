import AddtoCart from 'app/Icons/AddtoCart';
import CloseIcon from 'app/Icons/CloseIcon';
import DeleteIcon from 'app/Icons/DeleteIcon';
import EditIcon from 'app/Icons/EditIcon';
import NotificationIcon from 'app/Icons/NotificationIcon';
import PluseIcon from 'app/Icons/PluseIcon';
import SettingsIcon from 'app/Icons/SettingsIcon';
import ShareIcon from 'app/Icons/ShareIcon';
import WishlistIcon from 'app/Icons/WishlistIcon';
import React, { useState } from 'react';

// Define interfaces for type safety
interface WishlistItem {
    id: number;
    name: string;
    price: number;
    qty: number;
}

interface Wishlist {
    id: number;
    name: string;
    itemCount: number;
    lastUpdated: string;
    totalValue: number;
    items: WishlistItem[];
}

const WishListListing: React.FC = () => {
    const [wishlists, setWishlists] = useState<Wishlist[]>([
        {
            id: 1,
            name: 'Office Supplies',
            itemCount: 15,
            lastUpdated: '14/01/2024',
            totalValue: 2450.00,
            items: [
                { id: 1, name: 'Premium Mouse', price: 2450.00, qty: 5 },
                { id: 2, name: 'Premium Mouse', price: 2450.00, qty: 5 },
                { id: 3, name: 'Premium Mouse', price: 2450.00, qty: 5 },
                { id: 4, name: 'Premium Mouse', price: 2450.00, qty: 5 }
            ]
        },
        {
            id: 2,
            name: 'Office Supplies',
            itemCount: 15,
            lastUpdated: '14/01/2024',
            totalValue: 2450.00,
            items: []
        }
    ]);

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showShareModal, setShowShareModal] = useState<boolean>(false);
    const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
    const [newWishlistName, setNewWishlistName] = useState<string>('');
    const [editWishlistName, setEditWishlistName] = useState<string>('');

    const handleAddWishlist = (): void => {
        if (newWishlistName.trim()) {
            const newWishlist: Wishlist = {
                id: wishlists.length + 1,
                name: newWishlistName,
                itemCount: 0,
                lastUpdated: new Date().toLocaleDateString('en-GB'),
                totalValue: 0,
                items: []
            };
            setWishlists([...wishlists, newWishlist]);
            setNewWishlistName('');
            setShowAddModal(false);
        }
    };

    const handleDeleteWishlist = (): void => {
        if (selectedWishlist) {
            setWishlists(wishlists.filter(w => w.id !== selectedWishlist.id));
            setShowDeleteModal(false);
            setSelectedWishlist(null);
        }
    };

    const handleEditWishlist = (): void => {
        if (editWishlistName.trim() && selectedWishlist) {
            setWishlists(wishlists.map(w =>
                w.id === selectedWishlist.id ? { ...w, name: editWishlistName } : w
            ));
            setShowEditModal(false);
            setSelectedWishlist(null);
            setEditWishlistName('');
        }
    };

    const openDeleteModal = (wishlist: Wishlist): void => {
        setSelectedWishlist(wishlist);
        setShowDeleteModal(true);
    };

    const openEditModal = (wishlist: Wishlist): void => {
        setSelectedWishlist(wishlist);
        setEditWishlistName(wishlist.name);
        setShowEditModal(true);
    };

    const openShareModal = (wishlist: Wishlist): void => {
        setSelectedWishlist(wishlist);
        setShowShareModal(true);
    };

    const openWishlistModal = (wishlist: Wishlist): void => {
        setSelectedWishlist(wishlist);
        setShowOpenModal(true);
    };

    return (
        <div className="min-h-screen">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Wishlist Management</h1>
                        <p className="text-gray-500 text-sm">Manage and approve customer orders</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#5866FF] text-white px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
                        >
                            <PluseIcon />
                            Add New Wishlist
                        </button>
                        <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors border border-indigo-200">
                            <SettingsIcon color="#5866FF" />
                        </button>
                        <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors border border-indigo-200">
                            <NotificationIcon color="#5866FF" />
                        </button>
                    </div>
                </div>

                {/* Wishlist Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlists.map((wishlist) => (
                        <div
                            key={wishlist.id}
                            className="bg-white rounded-lg shadow-sm border border-indigo-100 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <div className='flex gap-3 items-center'>
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <WishlistIcon color='#5866FF' />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {wishlist.name}
                                        </h3>
                                    </div>
                                </div>
                                <span className="bg-gray-100 text-black font-semibold text-sm px-2 py-1 rounded">
                                    {wishlist.itemCount} items
                                </span>
                            </div>

                            <p className="text-sm text-gray-500 mb-6">
                                Last updated: {wishlist.lastUpdated}
                            </p>

                            <div className='flex justify-between mb-6'>
                                <div className='text-gray-500 font-semibold text-sm'>Total value</div>
                                <div className='text-black text-lg font-bold'>${wishlist.totalValue.toFixed(2)}</div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => openWishlistModal(wishlist)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-[#5866FF] text-white font-medium transition-colors"
                                >
                                    Open
                                </button>
                                <button
                                    onClick={() => openShareModal(wishlist)}
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ShareIcon />
                                </button>
                                <button
                                    onClick={() => openEditModal(wishlist)}
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() => openDeleteModal(wishlist)}
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {wishlists.length === 0 && (
                    <div className="text-center py-16">
                        <div className="mx-auto mb-4 inline-block">
                            <WishlistIcon color="#9CA3AF" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No wishlists yet</h3>
                        <p className="text-gray-600 mb-6">Create your first wishlist to get started</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 bg-[#5866FF] text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <PluseIcon />
                            Add New Wishlist
                        </button>
                    </div>
                )}
            </div>

            {/* Add Wishlist Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Add New Wishlist</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wishlist Name</label>
                            <input
                                type="text"
                                value={newWishlistName}
                                onChange={(e) => setNewWishlistName(e.target.value)}
                                placeholder="e.g office supplies"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddWishlist()}
                            />
                        </div>
                        <button
                            onClick={handleAddWishlist}
                            className="w-full px-4 py-3 bg-[#5866FF] text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Add Wishlist
                        </button>
                    </div>
                </div>
            )}

            {/* Open Wishlist Modal */}
            {showOpenModal && selectedWishlist && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-[600px] w-full p-[30px]">
                        <div className="flex justify-between items-center mb-6">
                            <div >
                                <h2 className="text-xl font-bold text-gray-900">{selectedWishlist.name}</h2>
                                <span className='text-[#6F7177] text-sm font-normal'>12 items . $2450.00</span>
                            </div>
                            <button onClick={() => setShowOpenModal(false)} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="space-y-3 mb-6 overflow-y-auto">
                            {selectedWishlist.items.map((item: WishlistItem) => (
                                <div key={item.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg"></div>
                                    <div className='flex-1 flex flex-col  justify-between'>
                                        <div className='flex-1 flex justify-between'>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                                <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                                            </div>
                                            <p className="font-bold text-gray-900">${item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex-1 flex justify-between items-end">
                                            <div className="text-[#6F7177] font-medium text-[12px]">SKU-1001</div>
                                            <div className="text-right">
                                                <button className="flex gap-3 items-center text-[16px] font-semibold bg-[#5866FF] text-white px-5 py-3 rounded">
                                                    <AddtoCart />
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="flex gap-3 justify-center items-center w-full py-3 bg-[#5866FF] text-white rounded-lg transition-colors font-semibold">
                        <AddtoCart />
                            Add All Items to Cart
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Wishlist Modal */}
            {showEditModal && selectedWishlist && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Edit Wishlist</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Name</label>
                            <input
                                type="text"
                                value={editWishlistName}
                                onChange={(e) => setEditWishlistName(e.target.value)}
                                placeholder="e.g office supplies"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleEditWishlist()}
                            />
                        </div>
                        <button
                            onClick={handleEditWishlist}
                            className="w-full px-4 py-3 bg-[#5866FF] text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Edit Wishlist
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Wishlist Modal */}
            {showDeleteModal && selectedWishlist && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Delete Wishlist</h2>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "<strong>{selectedWishlist.name}</strong>"? Once You delete this wishlist you can not undo this operation. All the data will be deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteWishlist}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Wishlist Modal */}
            {showShareModal && selectedWishlist && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Share Wishlist</h2>
                            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Shareable Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={`https://yourapp.com/wishlist/${selectedWishlist.id}`}
                                    readOnly
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none text-sm"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://yourapp.com/wishlist/${selectedWishlist.id}`);
                                    }}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="w-full px-4 py-3 bg-[#5866FF] text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WishListListing;