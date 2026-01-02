import AddtoCart from '../../Icons/AddtoCart';
import CloseIcon from '../../Icons/CloseIcon';
import DeleteIcon from '../../Icons/DeleteIcon';
import EditIconAlt from '../../Icons/EditIconAlt';
import PluseIcon from '../../Icons/PluseIcon';
import WishlistIcon from '../../Icons/WishlistIcon';
import SearchIcon from '../../Icons/SearchIcon';
import { useState, useEffect, useRef, useMemo } from 'react';

// Define interfaces for type safety
interface WishlistItem {
    id: string;
    productId: string;
    variantId: string;
    productTitle: string | null;
    variantTitle: string | null;
    image: string | null;
    price: number;
    quantity: number;
}

interface Wishlist {
    id: string;
    name: string;
    locationId: string | null;
    items: WishlistItem[];
    createdAt: string;
    updatedAt: string;
}

interface PageProps {
    customerId: string;
    shop: string;
    proxyUrl: string;
}

interface EditableItem {
    id?: string; // undefined for new items
    productId: string;
    variantId: string;
    productTitle: string;
    variantTitle: string;
    image: string;
    price: number;
    quantity: number;
    isNew?: boolean;
    isDeleted?: boolean;
}

interface CartItem {
    id: number;
    quantity: number;
}

const WishlistPage = ({ customerId, shop, proxyUrl }: PageProps) => {
    const [wishlists, setWishlists] = useState<Wishlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showShareModal, setShowShareModal] = useState<boolean>(false);
    const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
    const [isEditingWishlistName, setIsEditingWishlistName] = useState(false);
    const [wishlistName, setWishlistName] = useState(selectedWishlist?.name ?? "");
    const [newWishlistName, setNewWishlistName] = useState<string>('');

    //initial snapshot for change detection
    const [initialEditableItems, setInitialEditableItems] = useState<EditableItem[]>([]);
    const [initialWishlistName, setInitialWishlistName] = useState<string>('');

    // For the unified edit modal
    const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // State for the "Add Products" section in the popup
    const [addSearchQuery, setAddSearchQuery] = useState<string>('');
    const [addSearchResults, setAddSearchResults] = useState<any[]>([]);
    const [addSearchLoading, setAddSearchLoading] = useState(false);

    // Ref for Add Products quantity inputs
    const addQuantityRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

    //add to cart 
    const [addingWishlistId, setAddingWishlistId] = useState<string | null>(null);

    useEffect(() => {
        setWishlistName(selectedWishlist?.name ?? "");
    }, [selectedWishlist]);

    const handleSaveWishlistName = async () => {
        if (!selectedWishlist) return;

        const newName = wishlistName.trim();
        console.log("🚀 ~ handleSaveWishlistName ~ newName:", newName)
        if (!newName) {
            setWishlistName(selectedWishlist.name);
            setIsEditingWishlistName(false);
            return;
        }
        setIsEditingWishlistName(false);

    };

    // Fetch wishlists on mount
    useEffect(() => {
        fetchWishlists();
    }, []);

    // Effect for the new product search on the left panel
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (addSearchQuery.trim()) {
                searchAvailableProducts(addSearchQuery);
            } else {
                // --- MODIFIED: Removed the call to getDummyAvailableProducts() for empty search ---
                setAddSearchResults([]); // Set to empty array for empty search
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [addSearchQuery]);

    // Dummy data
    const getDummyAvailableProducts = () => {
        return [
            { id: 'p1', title: 'Wireless Bluetooth Headphones', image: headphoneImage, variants: [{ id: 'v1-1', title: 'Default', price: 79.99 }] },
            { id: 'p2', title: 'Leather Laptop Bag', image: bagImage, variants: [{ id: 'v2-1', title: 'Black', price: 120.00 }] },
            { id: 'p3', title: 'Portable Power Bank', image: headphoneImage, variants: [{ id: 'v3-1', title: '10000mAh', price: 45.99 }] },
            { id: 'p4', title: 'Smart Fitness Watch', image: headphoneImage, variants: [{ id: 'v4-1', title: 'Green', price: 89.99 }] },
            { id: 'p5', title: 'Smart Fitness Watch', image: watchImage, variants: [{ id: 'v5-1', title: 'Red', price: 89.99 }] },
            { id: 'p6', title: 'Smart Fitness Watch', image: watchImage, variants: [{ id: 'v6-1', title: 'Blue', price: 89.99 }] },
        ].map(p => ({
            ...p,
            variants: p.variants.map(v => ({ ...v, productId: p.id, productTitle: p.title, productImage: p.image }))
        }));
    };

    // For the actual product search (used in the old modal flow, now updated for the left panel)
    const searchAvailableProducts = async (query: string) => {
        if (!query.trim()) {
            setAddSearchResults([]); // --- MODIFIED: Set to empty array if query is empty ---
            return;
        }

        try {
            setAddSearchLoading(true);
            // Re-using the existing search endpoint
            const response = await fetch(`${proxyUrl}/product-search?q=${encodeURIComponent(query)}&shop=${shop}&logged_in_customer_id=${customerId}`);
            const data = await response.json();
            const productsWithVariants = (data.products || []).map((p: any) => ({
                ...p,
                variants: p.variants.map((v: any) => ({ ...v, productId: p.id, productTitle: p.title, productImage: p.image }))
            }));
            setAddSearchResults(productsWithVariants);
        } catch (error) {
            console.error('Error searching products:', error);
            // --- MODIFIED: Filter dummy data for error/fallback only if query is not empty ---
            setAddSearchResults(getDummyAvailableProducts().filter(p => p.title.toLowerCase().includes(query.toLowerCase())));
        } finally {
            setAddSearchLoading(false);
        }
    };

    const fetchWishlists = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${proxyUrl}/wishlist?shop=${shop}&logged_in_customer_id=${customerId}`);
            const data = await response.json();
            console.log('Fetched wishlists:', data.wishlists);
            if (data.wishlists) {
                setWishlists(data.wishlists);
                console.log('Wishlists state updated:', data.wishlists.map((w: Wishlist) => ({
                    name: w.name,
                    itemCount: w.items.length,
                    total: calculateTotalValue(w.items)
                })));
            }
        } catch (error) {
            console.error('Error fetching wishlists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWishlist = async (): Promise<void> => {
        if (newWishlistName.trim()) {
            try {
                const formData = new FormData();
                formData.append('action', 'CREATE_WISHLIST');
                formData.append('name', newWishlistName);

                const response = await fetch(`${proxyUrl}/wishlist?shop=${shop}&logged_in_customer_id=${customerId}`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                if (data.wishlist) {
                    await fetchWishlists();
                    setNewWishlistName('');
                    setShowAddModal(false);
                }
            } catch (error) {
                console.error('Error creating wishlist:', error);
            }
        }
    };

    const handleDeleteWishlist = async (): Promise<void> => {
        if (selectedWishlist) {
            try {
                const formData = new FormData();
                formData.append('action', 'DELETE_WISHLIST');
                formData.append('wishlistId', selectedWishlist.id);

                await fetch(`${proxyUrl}/wishlist?shop=${shop}&logged_in_customer_id=${customerId}`, {
                    method: 'POST',
                    body: formData,
                });

                await fetchWishlists();
                setShowDeleteModal(false);
                setSelectedWishlist(null);
            } catch (error) {
                console.error('Error deleting wishlist:', error);
            }
        }
    };

    const openEditModal = (wishlist: Wishlist): void => {
        setSelectedWishlist(wishlist);
        // Convert existing items to editable format
        const items: EditableItem[] = wishlist.items.map(item => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            productTitle: item.productTitle || '',
            variantTitle: item.variantTitle || '',
            image: item.image || '',
            price: item.price || 0,
            quantity: item.quantity,
            isNew: false,
            isDeleted: false,
        }));
        setEditableItems(items);

        //take a snapshot of initial data
        setInitialEditableItems(JSON.parse(JSON.stringify(items)));
        setWishlistName(wishlist.name);
        setInitialWishlistName(wishlist.name);

        setSearchQuery('');
        setSearchResults([]);
        // Initialize the Add Products section
        setAddSearchQuery('');
        // --- MODIFIED: Set to empty array instead of calling getDummyAvailableProducts() ---
        setAddSearchResults([]);
        setAddSearchLoading(false);
        setShowEditModal(true);
    };

    const hasChanges = useMemo(() => {
        // name changed?
        if (wishlistName !== initialWishlistName) return true;

        // items changed? (added, removed, qty, deleted flag, etc.)
        return JSON.stringify(editableItems) !== JSON.stringify(initialEditableItems);
    }, [wishlistName, initialWishlistName, editableItems, initialEditableItems]);

    const isSaveDisabled = submitting || !hasChanges;

    const addProductToEditable = (product: any, variant: any, quantity: number = 1) => {
        // Ensure quantity is at least 1
        const finalQuantity = Math.max(1, quantity);

        // Check if already exists (considering only items not marked for deletion)
        const existsIndex = editableItems.findIndex(item => item.variantId === variant.id && !item.isDeleted);

        if (existsIndex !== -1) {
            // Update quantity of existing item
            setEditableItems(editableItems.map((item, index) =>
                index === existsIndex
                    ? { ...item, quantity: item.quantity + finalQuantity, isDeleted: false } // Also ensure isDeleted is false if re-adding
                    : item
            ));
        } else {
            // Add new item
            const newItem: EditableItem = {
                productId: product.id,
                variantId: variant.id,
                productTitle: product.title,
                variantTitle: variant.title || 'Default Title',
                image: product.image || variant.productImage || '',
                price: parseFloat(variant.price),
                quantity: finalQuantity,
                isNew: true,
                isDeleted: false,
            };
            setEditableItems([...editableItems, newItem]);
        }
    };

    const updateItemQuantity = (variantId: string, quantity: number) => {
        setEditableItems(editableItems.map(item =>
            item.variantId === variantId ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
    };

    const markItemAsDeleted = (variantId: string) => {
        setEditableItems(editableItems.map(item =>
            item.variantId === variantId ? { ...item, isDeleted: true } : item
        ));
    };

    const handleSaveWishlist = async () => {
        if (!selectedWishlist) return;

        try {
            setSubmitting(true);
            console.log('Starting save process...');
            console.log('Editable items:', editableItems);

            //UPDATE WISHLIST NAME (if changed)
            const trimmedName = wishlistName.trim();

            if (!trimmedName) {
                setWishlistName(initialWishlistName);
            } else if (trimmedName !== initialWishlistName) {
                console.log('Updating wishlist name to:', trimmedName);
                const formData = new FormData();
                formData.append('action', 'UPDATE_WISHLIST');
                formData.append('wishlistId', selectedWishlist.id);
                formData.append('name', trimmedName);

                const response = await fetch(
                    `${proxyUrl}/wishlist?shop=${shop}&logged_in_customer_id=${customerId}`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );
                const result = await response.json();
                console.log('Update wishlist name result:', result);
            }

            // Process deletions
            const itemsToDelete = editableItems.filter(item => item.id && item.isDeleted);
            console.log('Items to delete:', itemsToDelete.length);
            for (const item of itemsToDelete) {
                const formData = new FormData();
                formData.append('action', 'DELETE_ITEM');
                formData.append('itemId', item.id!);
                const response = await fetch(`${proxyUrl}/wishlist?shop=${shop}&logged_in_customer_id=${customerId}`, {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                console.log('Delete result:', result);
            }

            // Process updates (existing items with changed quantities)
            const itemsToUpdate = editableItems.filter(item => item.id && !item.isNew && !item.isDeleted);
            console.log('Items to update:', itemsToUpdate.length, itemsToUpdate);
            for (const item of itemsToUpdate) {
                const originalItem = selectedWishlist.items.find(original => original.id === item.id);
                if (originalItem && originalItem.quantity !== item.quantity) {
                    const formData = new FormData();
                    formData.append('action', 'UPDATE_ITEM');
                    formData.append('itemId', item.id!);
                    formData.append('quantity', item.quantity.toString());
                    const response = await fetch(`${proxyUrl}/wishlist?shop=${shop}&logged_in_customer_id=${customerId}`, {
                        method: 'POST',
                        body: formData,
                    });
                    const result = await response.json();
                    console.log('Update result:', result);
                }
            }

            // Process new items
            const newItems = editableItems.filter(item => item.isNew && !item.isDeleted);
            console.log('New items to add:', newItems.length, newItems);
            if (newItems.length > 0) {
                const itemsPayload = newItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                }));

                const formData = new FormData();
                formData.append('action', 'ADD_ITEMS_BATCH');
                formData.append('wishlistId', selectedWishlist.id);
                formData.append('items', JSON.stringify(itemsPayload));
                const response = await fetch(`${proxyUrl}/wishlist?shop=${shop}&logged_in_customer_id=${customerId}`, {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                console.log('Batch add result:', result);
            }

            // Refresh the wishlists data
            console.log('Refreshing wishlists...');
            // Small delay to ensure DB transactions complete
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchWishlists();

            // Close modal and cleanup
            setShowEditModal(false);
            setSelectedWishlist(null);
            setEditableItems([]);
            setSearchQuery('');
            setSearchResults([]);
            setAddSearchQuery('');
            setAddSearchResults([]);

            console.log('Wishlist saved successfully');
        } catch (error) {
            console.error('Error saving wishlist:', error);
            alert('Error saving wishlist. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteModal = (wishlist: Wishlist): void => {
        setSelectedWishlist(wishlist);
        setShowDeleteModal(true);
    };

    const openShareModal = (wishlist: Wishlist): void => {
        setSelectedWishlist(wishlist);
        setShowShareModal(true);
    };

    const calculateTotalValue = (items: WishlistItem[]): number => {
        return items.reduce((total, item) => total + ((item.price || 0) * item.quantity), 0);
    };

    const calculateEditableTotal = (): number => {
        return editableItems
            .filter(item => !item.isDeleted)
            .reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const calculateEditableItemCount = (): number => {
        return editableItems.filter(item => !item.isDeleted).length;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading wishlists...</div>
            </div>
        );
    }

    function extractVariantIdFromGid(gid: string) {
        if (!gid) return null;
        return gid.split('/').pop();
    }

    async function addMultipleItemsToCart(items: CartItem[]) {
        const requestBody = { items };

        const response = await fetch(
            (window.Shopify?.routes?.root || '/') + 'cart/add.js',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                `Cart error: ${response.status} ${response.statusText} - ${text}`
            );
        }

        const data = await response.json();
        console.log('Items added to cart:', data);
        return data;
    }

    const handleAddWishlistToCart = async (wishlist: Wishlist): Promise<void> => {
        console.log("🚀 ~ handleAddWishlistToCart ~ wishlist:", wishlist)
        
        try {
            setAddingWishlistId(wishlist.id);

            const itemsForCart: CartItem[] = wishlist.items.reduce<CartItem[]>(
                (acc, item) => {
                    const variantId = extractVariantIdFromGid(item.variantId);
                    if (!variantId) return acc;

                    acc.push({
                        id: Number(variantId),
                        quantity: item.quantity || 1,
                    });

                    return acc;
                },
                []
            );

            if (!itemsForCart.length) {
                console.warn('No valid items to add for this wishlist');
                return;
            }

            await addMultipleItemsToCart(itemsForCart);

        } catch (error) {
            console.error('Failed to add wishlist to cart:', error);
        } finally {
            window.location.href = "/cart";
            // setAddingWishlistId(null);

        }
    };

    return (
        <div className="min-h-screen">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Wishlist Management</h1>
                        <p className="text-gray-500 text-sm">Manage your saved items and wishlists</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#5866FF] hover:bg-[#4e5be6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <PluseIcon />
                            Add New Wishlist
                        </button>
                    </div>
                </div>

                {/* Wishlist Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlists.map((wishlist) => (
                        <div
                            key={wishlist.id}
                            className="bg-white rounded-lg shadow-sm border border-[#DDE4FF] p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <div className='flex gap-3 items-center'>
                                    <div className="p-2 bg-[#DDE4FF] rounded-lg">
                                        <WishlistIcon color='#5866FF' />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {wishlist.name}
                                        </h3>
                                    </div>
                                </div>
                                <span className="bg-gray-100 text-black font-semibold text-sm px-2 py-1 rounded">
                                    {wishlist.items.length} items
                                </span>
                            </div>

                            <p className="text-sm text-gray-500 mb-6">
                                Last updated: {formatDate(wishlist.updatedAt)}
                            </p>

                            <div className='flex justify-between mb-6'>
                                <div className='text-gray-500 font-semibold text-sm'>Total value</div>
                                <div className='text-black text-lg font-bold'>${calculateTotalValue(wishlist.items).toFixed(2)}</div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => openEditModal(wishlist)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-[#5866FF] text-white font-medium transition-colors hover:bg-indigo-700 cursor-pointer"
                                >
                                    Open
                                </button>
                                {/* Add to cart with loader */}
                                <button
                                    onClick={() => handleAddWishlistToCart(wishlist)}
                                    disabled={addingWishlistId === wishlist.id}
                                    className={`
                                    p-2 border border-gray-300 rounded-lg transition-colors
                                    flex items-center justify-center                 
                                    ${addingWishlistId === wishlist.id
                                            ? 'opacity-60 cursor-not-allowed'
                                            : 'hover:bg-green-100 cursor-pointer'
                                        }
                                `}
                                >
                                    {addingWishlistId === wishlist.id ? (
                                        <span className="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <AddtoCart />
                                    )}
                                </button>
                                <button
                                    onClick={() => openDeleteModal(wishlist)}
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
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
                            className="inline-flex items-center gap-2 bg-[#5866FF] text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium cursor-pointer"
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
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
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
                            className="w-full px-4 py-3 bg-[#5866FF] text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium cursor-pointer"
                        >
                            Add Wishlist
                        </button>
                    </div>
                </div>
            )}

            {/* UNIFIED Edit/View Wishlist Modal */}
            {showEditModal && selectedWishlist && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-[1300px] w-full max-h-[75vh] overflow-hidden flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 hidden">
                            {/* Hidden as per image, but useful for context/close button */}
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedWishlist(null);
                                    setEditableItems([]);
                                    setAddSearchQuery('');
                                    setAddSearchResults([]);
                                }}
                                className="text-gray-400 hover:text-gray-600 absolute top-4 right-4 cursor-pointer"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Content: Left Panel (Add Products) and Right Panel (Wishlist) */}
                        <div className="flex-1 flex overflow-hidden popup-wrapper p-5 gap-3">

                            {/* LEFT PANEL: Add Products */}
                            <div className="wl-left-panel w-[350px] border border-[#DDE4FF] rounded-[10px] bg-white flex flex-col p-5 overflow-y-auto">
                                <h2 className="text-xl font-bold text-gray-900 mb-5">
                                    Add Products
                                    <span className='bg-[#F5F5FF] text-dark text-[12px] font-semibold ml-3 px-4 py-2 rounded'>
                                        80 Available
                                    </span>
                                </h2>

                                {/* Search Bar */}
                                <div className="mb-4 relative">
                                    <input
                                        type="text"
                                        value={addSearchQuery}
                                        onChange={(e) => setAddSearchQuery(e.target.value)}
                                        placeholder="Search Products to add"
                                        className="w-full px-4 py-3 pl-10 bg-[#FBFBFF] border border-[#5866FF29] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div className="absolute left-3 top-5">
                                        <SearchIcon />
                                    </div>
                                </div>

                                {/* Available Products List */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {addSearchLoading ? (
                                        <div className="text-center py-8 text-gray-500">Loading products...</div>
                                    ) : addSearchResults.length === 0 && !addSearchQuery.trim() ? (
                                        <div className="text-center py-16 px-4">
                                            <div className="text-6xl mb-4">📦</div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                Search Products
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                Start typing in the search bar to find products you want to add to the wishlist.
                                            </p>
                                        </div>
                                    ) : addSearchResults.length === 0 && addSearchQuery.trim() ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No products found for "{addSearchQuery}".
                                        </div>
                                    ) : (
                                        addSearchResults.map((product) => {
                                            // Assuming for simplicity that each product in this list has only ONE variant
                                            const variant = product.variants[0];
                                            const itemKey = variant.variantId || product.id;

                                            // Check if this variant is already in the editable list and not deleted
                                            const isAlreadyAdded = editableItems.some(item => item.variantId === variant.id && !item.isDeleted);

                                            return (
                                                <div key={itemKey} className="flex items-center gap-3 py-3 border-b border-[#DDE4FF] last:border-b-0">
                                                    <div className="wl-search-product-image w-[50px] h-[50px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        {variant.productImage && <img src={variant.productImage} alt={product.title} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{product.title}</h4>
                                                        <p className="text-[14px] text-[#5866FF] font-bold mt-1">${parseFloat(variant.price).toFixed(2)}</p>
                                                    </div>

                                                    {/* Quantity and Add Button */}
                                                    <div className="flex flex-col items-center justify-between gap-1 flex-shrink-0">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            defaultValue="1"
                                                            ref={el => addQuantityRefs.current.set(itemKey, el)}
                                                            className="w-[70px] h-[28px] text-[13px] text-dark font-bold px-3 border border-[#5866FF26] rounded-lg bg-[#FBFBFF] text-center"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const qtyInput = addQuantityRefs.current.get(itemKey);
                                                                const qty = parseInt(qtyInput?.value || '1');
                                                                addProductToEditable(product, variant, qty);
                                                                if (qtyInput) qtyInput.value = '1'; // Reset quantity after adding
                                                            }}
                                                            disabled={isAlreadyAdded}
                                                            className={`w-[70px] h-[28px] text-[14px] px-4 rounded-lg font-semibold transition-colors cursor-pointer ${isAlreadyAdded
                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                : 'bg-[#5866FF] text-white hover:bg-indigo-700'
                                                                }`}
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* RIGHT PANEL: Wishlist Items */}
                            <div className="wl-right-panel flex-1 flex flex-col p-5 overflow-hidden border border-[#DDE4FF] rounded-[10px] bg-white">

                                {/* Wishlist Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        {isEditingWishlistName ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={wishlistName}
                                                onChange={(e) => setWishlistName(e.target.value)}
                                                onBlur={handleSaveWishlistName}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Escape") {
                                                        setWishlistName(initialWishlistName);
                                                        setIsEditingWishlistName(false);
                                                    }
                                                }}
                                                className="text-xl font-bold text-gray-900 mr-3 border border-[#DDE4FF] rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <>
                                                <h2 className="text-xl font-bold text-gray-900 mr-3">
                                                    {wishlistName}
                                                </h2>
                                                <button
                                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                                    onClick={() => setIsEditingWishlistName(true)}
                                                >
                                                    <EditIconAlt />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-[#F5F5FF] text-dark text-[12px] font-semibold ml-3 px-4 py-1 rounded-lg">
                                        {calculateEditableItemCount()} products • $
                                        {calculateEditableTotal().toFixed(2)} Items
                                    </div>
                                </div>

                                {/* Search in Wishlist */}
                                <div className="mb-6 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search in Wishlist..."
                                        className="w-full px-4 py-3 pl-10 bg-[#FBFBFF] border border-[#5866FF29] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div className="absolute left-3 top-5">
                                        <SearchIcon />
                                    </div>
                                </div>

                                {/* Wishlist Table/List */}
                                <div className="rounded-[10px] flex-1 overflow-y-auto pr-2 custom-scrollbar border border-[#5866FF29]">
                                    {calculateEditableItemCount() === 0 ? (
                                        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                                            No items in this wishlist yet. Add products from the left panel.
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead>
                                                <tr className="text-left text-sm font-semibold text-gray-500 bg-gray-50 sticky top-0">
                                                    <th className="px-5 py-4.5 w-20">Image</th>
                                                    <th className="px-3 py-4.5">Product</th>
                                                    <th className="px-3 py-4.5">Category</th>
                                                    <th className="px-3 py-4.5">Price</th>
                                                    <th className="px-3 py-4.5 w-24 text-center">Quantity</th>
                                                    <th className="px-3 py-4.5 text-center">Subtotal</th>
                                                    <th className="px-3 py-4.5 w-16 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {editableItems.filter(item => !item.isDeleted).filter(item =>
                                                    item.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    item.variantTitle.toLowerCase().includes(searchQuery.toLowerCase())
                                                ).map((item, index) => (
                                                    <tr key={item.variantId + (item.id || 'new' + index)} className="hover:bg-gray-50 transition-colors">
                                                        <td className="w-[100px] px-5 py-4">
                                                            <div className="wl-product-img w-[60px] h-[60px] bg-gray-100 rounded-lg overflow-hidden">
                                                                {item.image && <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4">
                                                            <div className='flex flex-col'>
                                                                <div className="font-medium text-[#000] text-[14px] font-bold">{item.productTitle}</div>
                                                                <div className="text-sm text-gray-500">{item.variantTitle}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4"><span className='px-3 py-3 text-sm text-[#5866FF] bg-[#F5F5FF] font-semibold rounded-lg'>Electronics</span></td> {/* Placeholder for category */}
                                                        <td className="px-3 py-4">
                                                            <span className='text-[14px] font-bold text-[#000]'>${item.price.toFixed(2)}</span>
                                                        </td>
                                                        <td className="px-3 py-4">
                                                            <div className="flex items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItemQuantity(item.variantId, Math.max(1, parseInt(e.target.value) || 1))}
                                                                    className="w-[70px] h-[28px] text-center text-[14px] bg-[#FBFBFF] font-bold border-[#5866FF26] focus:outline-none"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="subtotal text-center px-3 py-3 text-sm font-bold text-gray-900">
                                                            <span className='font-bold text-[14px] text-[#5866FF]'> ${(item.price * item.quantity).toFixed(2)}</span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <button
                                                                onClick={() => markItemAsDeleted(item.variantId)}
                                                                className="text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                                                            >
                                                                <DeleteIcon />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                {/* Footer - Save Button */}
                                <div className="mt-6">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setSelectedWishlist(null);
                                                setEditableItems([]);
                                            }}
                                            className="w-full px-4 py-4 border border-[#DDE4FF] rounded-[8px] bg-white text-gray-700 hover:bg-[#EF4444] hover:text-white transition-colors font-semibold cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveWishlist}
                                            disabled={isSaveDisabled}
                                            className={`w-full px-4 py-4 rounded-[8px] font-semibold transition-colors
                                                 ${isSaveDisabled
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-[#5866FF] text-white hover:bg-indigo-700 cursor-pointer'
                                                }
    `}
                                        >
                                            {submitting
                                                ? 'Saving...'
                                                : `Save Changes (${calculateEditableItemCount()} Items • $${calculateEditableTotal().toFixed(2)})`}
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Wishlist Modal */}
            {showDeleteModal && selectedWishlist && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Delete Wishlist</h2>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <CloseIcon />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "<strong>{selectedWishlist.name}</strong>"? Once you delete this wishlist you cannot undo this operation. All the data will be deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteWishlist}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
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
                            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Shareable Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={`${proxyUrl}/wishlist/${selectedWishlist.id}`}
                                    readOnly
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none text-sm"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${proxyUrl}/wishlist/${selectedWishlist.id}`);
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

export default WishlistPage;