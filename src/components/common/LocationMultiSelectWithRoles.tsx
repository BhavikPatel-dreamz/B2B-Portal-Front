import React, { useEffect, useState } from "react";

type Location = {
  id: string | number;
  name: string;
};

type RoleOption = {
  value: string;
  name: string;
};

type LocationRole = {
  locationId: string | number;
  locationName: string;
  roleName: string;
};

type EditFormData = {
  name: string;
  email: string;
  credit: number | null;
  locationRoles: LocationRole[];
};

type Props = {
  locations: Location[];
  roles: RoleOption[];
  editFormData: EditFormData;
  setEditFormData: React.Dispatch<React.SetStateAction<EditFormData>>;
};

const LocationMultiSelectWithRoles: React.FC<Props> = ({
  locations,
  roles,
  editFormData,
  setEditFormData,
}) => {
  const [selectedLocIds, setSelectedLocIds] = useState<Array<string | number>>(
    () => editFormData.locationRoles.map((lr) => lr.locationId)
  );

  const [searchTerm, setSearchTerm] = useState<string>("");

  const normalize = (s: unknown) =>
    s === undefined || s === null ? "" : String(s).trim();

  const arraysEqualAsSets = (
    a: Array<string | number>,
    b: Array<string | number>
  ) => {
    if (a.length !== b.length) return false;
    const sa = new Set(a.map(String));
    for (const x of b) {
      if (!sa.has(String(x))) return false;
    }
    return true;
  };

  const findRoleOption = (storedKey?: string) => {
    if (!storedKey) return undefined;
    const key = normalize(storedKey);
    if (!key) return undefined;

    let found = roles.find((r) => r.name === storedKey || r.value === storedKey);
    if (found) return found;

    const keyLower = key.toLowerCase();
    found =
      roles.find((r) => normalize(r.name).toLowerCase() === keyLower) ??
      roles.find((r) => normalize(r.value).toLowerCase() === keyLower);
    if (found) return found;

    found =
      roles.find((r) => keyLower.includes(normalize(r.name).toLowerCase())) ??
      roles.find((r) => normalize(r.name).toLowerCase().includes(keyLower));
    if (found) return found;

    found = roles.find(
      (r) => normalize(r.name) === key || normalize(r.value) === key
    );
    if (found) return found;

    return undefined;
  };

  useEffect(() => {
    const fromEdit = editFormData.locationRoles.map((lr) => lr.locationId);
    if (!arraysEqualAsSets(fromEdit, selectedLocIds)) {
      setSelectedLocIds(fromEdit);
    }
  }, [editFormData.locationRoles]);

  //BACK-FILL MISSING locationId
  useEffect(() => {
    if (!locations.length || !editFormData.locationRoles.length) return;

    let changed = false;

    const patched = editFormData.locationRoles.map((lr) => {
      if (lr.locationId !== undefined && lr.locationId !== null) {
        return lr;
      }
      const match = locations.find(
        (loc) => normalize(loc.name).toLowerCase() ===
          normalize(lr.locationName).toLowerCase()
      );
      if (!match) return lr;
      changed = true;
      return { ...lr, locationId: match.id };
    });

    if (changed) {
      setEditFormData((prev) => ({
        ...prev,
        locationRoles: patched,
      }));
    }
  }, [locations, editFormData.locationRoles, setEditFormData]);

  const toggleLocation = (loc: Location) => {
    setSelectedLocIds((prev) =>
      prev.includes(loc.id) ? prev.filter((id) => id !== loc.id) : [...prev, loc.id]
    );

    // update form data
    setEditFormData((prev) => {
      const existingIndex = prev.locationRoles.findIndex(
        (lr) => lr.locationId === loc.id || lr.locationName === loc.name
      );

      let nextRoles: LocationRole[];

      if (existingIndex >= 0) {
        nextRoles = [...prev.locationRoles];
        nextRoles.splice(existingIndex, 1);
      } else {
        nextRoles = [
          ...prev.locationRoles,
          {
            locationId: loc.id,
            locationName: loc.name,
            roleName: roles[0]?.name ?? "",
          },
        ];
      }

      return { ...prev, locationRoles: nextRoles };
    });
  };

  const changeRoleForLocation = (loc: Location, roleName: string) => {
    setEditFormData((prev) => {
      const existingIndex = prev.locationRoles.findIndex(
        (lr) => lr.locationId === loc.id || lr.locationName === loc.name
      );

      if (existingIndex === -1) {
        return {
          ...prev,
          locationRoles: [
            ...prev.locationRoles,
            {
              locationId: loc.id,
              locationName: loc.name,
              roleName,
            },
          ],
        };
      }

      const updated = prev.locationRoles.map((lr, idx) =>
        idx === existingIndex ? { ...lr, roleName } : lr
      );
      return { ...prev, locationRoles: updated };
    });
  };

  const processedLocations = locations.map((loc) => {
    const selectedObj = editFormData.locationRoles.find(
      (lr) => lr.locationId === loc.id || lr.locationName === loc.name
    );
    
    const isChecked = selectedLocIds.includes(loc.id);

    const storedRoleKey = normalize(selectedObj?.roleName);
    const matchedRole = storedRoleKey ? findRoleOption(storedRoleKey) : undefined;

    const roleLabel =
      matchedRole?.name ??
      (storedRoleKey ? storedRoleKey : isChecked ? roles[0]?.name ?? "" : "");

    return {
      loc,
      isChecked,
      selectedObj,
      matchedRole,
      roleLabel,
    };
  });

  const filtered = processedLocations.filter(({ loc }) =>
    loc.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div>
      <label className="block text-sm font-medium text-black mb-1">Locations</label>

      {/* Search bar + count */}
      <div className="flex items-center gap-2 mb-3">
        <input
          aria-label="Search locations"
          type="search"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 h-10 px-3 border border-[#E6E9F2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5866FF]"
        />
        <div className="text-sm text-gray-500">
          {filtered.length} / {locations.length}
        </div>
      </div>

      {/* Scrollable list container */}
      <div className="border border-[#E8EDF8] rounded-lg">
        <div
          style={{ maxHeight: 160 }}
          className="overflow-y-auto px-2 py-2 space-y-2"
        >
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No locations found
            </div>
          ) : (
            filtered.map(({ loc, isChecked, roleLabel }) => (
              <div
                key={loc.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 p-2 rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLocation(loc)}
                    className="h-5 w-5 border-[#5866FF] rounded checked:bg-[#5866FF] checked:border-[#5866FF]"
                    aria-checked={isChecked}
                    aria-label={`Select ${loc.name}`}
                  />
                  <span className="text-sm text-gray-700 truncate">{loc.name}</span>
                </div>

                {/* Role pills */}
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const active = isChecked && roleLabel === r.name;

                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => {
                          if (!isChecked) {
                            setSelectedLocIds((prev) =>
                              prev.includes(loc.id) ? prev : [...prev, loc.id]
                            );
                          }
                          changeRoleForLocation(loc, r.name);
                        }}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors duration-100 whitespace-nowrap
                                 ${isChecked ? "cursor-pointer" : "cursor-not-allowed"}
                            ${active
                            ? "bg-[#5866FF] text-white border-[#5866FF] shadow-sm"
                            : isChecked
                              ? "bg-white text-gray-800 border-[#DDE4FF] hover:shadow-sm"
                              : "bg-gray-100 text-gray-400 border-transparent"
                          }
                        `}
                        aria-pressed={active}
                        aria-label={`Set ${loc.name} role to ${r.name}`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationMultiSelectWithRoles;
