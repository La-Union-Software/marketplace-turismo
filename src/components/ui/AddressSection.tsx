'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Search, MapPin } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface State {
  id: string;
  name: string;
  code: string;
}

interface City {
  id: string;
  name: string;
  code: string;
}

interface AddressData {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  address: string;
}

interface AddressSectionProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  placeholder?: string;
  disabled?: boolean;
  showExternalToggle?: boolean;
}

export default function AddressSection({ 
  value, 
  onChange, 
  placeholder = "Seleccionar dirección...",
  disabled = false,
  showExternalToggle = true
}: AddressSectionProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [useExternalData, setUseExternalData] = useState(true);

  // Load countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/locations/countries');
        const data = await response.json();
        setCountries(data);
        
        // Set default country to Argentina
        if (data.length > 0 && !value.country) {
          const argentina = data.find((c: Country) => c.code === 'AR');
          if (argentina) {
            onChange({
              ...value,
              country: argentina.code
            });
          }
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (value.country) {
      const fetchStates = async () => {
        setLoadingStates(true);
        try {
          const response = await fetch(`/api/locations/states?country=${value.country}`);
          const data = await response.json();
          setStates(data);
          
          // Reset state and city when country changes
          onChange({
            ...value,
            state: '',
            city: '',
            postalCode: '',
            address: ''
          });
        } catch (error) {
          console.error('Error fetching states:', error);
        } finally {
          setLoadingStates(false);
        }
      };

      fetchStates();
    } else {
      setStates([]);
      setCities([]);
    }
  }, [value.country]);

  // Load cities when state changes
  useEffect(() => {
    if (value.state) {
      const fetchCities = async () => {
        setLoadingCities(true);
        try {
          // Use external or local data based on toggle
          const response = await fetch(`/api/locations/cities?state=${value.state}&external=${useExternalData}&limit=500`);
          const data = await response.json();
          
          // Handle both old format (array) and new format (object with cities property)
          const citiesData = data.cities || data;
          setCities(citiesData);
          setFilteredCities(citiesData);
          
          // Reset city when state changes
          onChange({
            ...value,
            city: '',
            postalCode: '',
            address: ''
          });
        } catch (error) {
          console.error('Error fetching cities:', error);
          // Fallback to local data
          try {
            const fallbackResponse = await fetch(`/api/locations/cities?state=${value.state}&external=false`);
            const fallbackData = await fallbackResponse.json();
            const citiesData = fallbackData.cities || fallbackData;
            setCities(citiesData);
            setFilteredCities(citiesData);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setCities([]);
            setFilteredCities([]);
          }
        } finally {
          setLoadingCities(false);
        }
      };

      fetchCities();
    } else {
      setCities([]);
      setFilteredCities([]);
    }
  }, [value.state, useExternalData]);

  // Filter cities based on search
  useEffect(() => {
    if (citySearch) {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(citySearch.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cities);
    }
  }, [citySearch, cities]);

  const handleCountryChange = (countryCode: string) => {
    onChange({
      ...value,
      country: countryCode,
      state: '',
      city: '',
      postalCode: '',
      address: ''
    });
  };

  const handleStateChange = (stateCode: string) => {
    onChange({
      ...value,
      state: stateCode,
      city: '',
      postalCode: '',
      address: ''
    });
  };

  const handleCitySelect = (city: City) => {
    onChange({
      ...value,
      city: city.code
    });
    setCitySearch(city.name);
    setShowCityDropdown(false);
  };

  const handleCitySearchChange = (search: string) => {
    setCitySearch(search);
    setShowCityDropdown(true);
  };

  const getSelectedCountry = () => {
    return countries.find(c => c.code === value.country);
  };

  const getSelectedState = () => {
    return states.find(s => s.code === value.state);
  };

  const getSelectedCity = () => {
    return cities.find(c => c.code === value.city);
  };

  return (
    <div className="space-y-4">
      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          País *
        </label>
        <select
          value={value.country}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Seleccionar país</option>
          {countries.map((country) => (
            <option key={country.id} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Provincia/Estado *
        </label>
        <select
          value={value.state}
          onChange={(e) => handleStateChange(e.target.value)}
          disabled={disabled || !value.country || loadingStates}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {loadingStates ? 'Cargando provincias...' : 'Seleccionar provincia/estado'}
          </option>
          {states.map((state) => (
            <option key={state.id} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {/* External Data Toggle */}
      {showExternalToggle && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fuente de datos de ciudades
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {useExternalData 
                ? 'Usando datos externos (más ciudades disponibles)' 
                : 'Usando datos locales (más rápido)'
              }
            </p>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useExternalData}
              onChange={(e) => setUseExternalData(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Datos externos
            </span>
          </label>
        </div>
      )}

      {/* City */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ciudad *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={citySearch}
            onChange={(e) => handleCitySearchChange(e.target.value)}
            onFocus={() => setShowCityDropdown(true)}
            disabled={disabled || !value.state || loadingCities}
            placeholder={loadingCities ? 'Cargando ciudades...' : 'Buscar ciudad...'}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* City Dropdown */}
        {showCityDropdown && filteredCities.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  {city.name}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No cities found */}
        {showCityDropdown && filteredCities.length === 0 && citySearch && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
              No se encontraron ciudades
            </div>
          </div>
        )}
      </div>

      {/* Postal Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Código Postal
        </label>
        <input
          type="text"
          value={value.postalCode}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
          disabled={disabled}
          placeholder="Ej: 1000"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dirección *
        </label>
        <input
          type="text"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          disabled={disabled}
          placeholder="Ej: Av. Corrientes 1234"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Address Summary */}
      {(value.country || value.state || value.city || value.address) && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Resumen de la dirección:
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {[
              value.address,
              getSelectedCity()?.name,
              getSelectedState()?.name,
              getSelectedCountry()?.name
            ].filter(Boolean).join(', ')}
            {value.postalCode && ` (${value.postalCode})`}
          </p>
        </div>
      )}
    </div>
  );
}
