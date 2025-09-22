'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  FileText,
  Settings,
  Eye,
  Home,
  Car,
  GraduationCap,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { ServiceCategory, BasePost, Pricing, FixedPricing, DynamicPricing, DynamicPricingSeason, Weekday, PostImage, CancellationPolicy } from '@/types';
import { serviceCategories, categoryFields, mainCategoryMapping, categoryAmenities } from '@/services/dummyData';
import { generateId } from '@/lib/utils';
import AddressSearch from '@/components/ui/AddressSearch';
import { fileToBase64, filesToBase64, compressBase64Image } from '@/lib/imageUtils';
import { firebaseDB } from '@/services/firebaseService';
import { useAuth } from '@/lib/auth';
import PostImages from '@/components/ui/PostImages';


interface PostFormData {
  // Main Category
  mainCategory: string;
  
  // Basic Information
  title: string;
  description: string;
  category: ServiceCategory | '';
  location: string;
  locationData?: {
    lat: string;
    lon: string;
    place_id: string;
    display_name: string;
  };
  mainImage: string; // Single main image
  images: string[]; // Multiple additional images
  
  // Specific Information (varies by category)
  specificFields: Record<string, unknown>;
  
  // Pricing Information
  pricing: Pricing | null;
  
  // Cancellation Policies
  cancellationPolicies: CancellationPolicy[];
  
  // Terms and Conditions
  termsAccepted: boolean;
  
  // Status
  isActive: boolean;
}

const mainCategories = [
  {
    id: 'alojamiento',
    title: 'Alojamiento',
    description: 'Publicá casas, cabañas, hoteles, departamentos, campings y mucho más.',
    icon: Home,
  },
  {
    id: 'alquiler-vehiculos',
    title: 'Alquiler de vehículos',
    description: 'Publicá autos, bicicletas, kayaks y cualquier tipo de vehículo.',
    icon: Car,
  },
  {
    id: 'clases-instructorados',
    title: 'Clases e instructorados',
    description: 'Clases de sky, snowboard y mucho más.',
    icon: GraduationCap,
  },
];

const steps = [
  {
    id: 'main-category',
    title: 'Categoría Principal',
    description: 'Selecciona el tipo de servicio',
    icon: FileText,
  },
  {
    id: 'information',
    title: 'Información del Servicio',
    description: 'Información básica, específica e imágenes',
    icon: FileText,
  },
  {
    id: 'pricing',
    title: 'Precio',
    description: 'Configura el precio de tu servicio',
    icon: Settings,
  },
  {
    id: 'cancellation',
    title: 'Políticas de Cancelación',
    description: 'Configura las políticas de cancelación',
    icon: Settings,
  },
  {
    id: 'review',
    title: 'Revisar y Publicar',
    description: 'Revisa toda la información antes de publicar',
    icon: Eye,
  },
];

interface PostFormWizardProps {
  editMode?: boolean;
  postData?: BasePost;
  images?: PostImage[];
  onSuccess?: () => void;
}

export default function PostFormWizard({ 
  editMode = false, 
  postData, 
  images = [], 
  onSuccess 
}: PostFormWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<PostFormData>({
    mainCategory: '',
    title: '',
    description: '',
    category: '',
    location: '',
    mainImage: '',
    images: [],
    specificFields: {},
    pricing: null,
    cancellationPolicies: [],
    termsAccepted: false,
    isActive: true,
  });

  // Populate form data when in edit mode
  useEffect(() => {
    if (editMode && postData) {
      // Determine main category from post category
      let mainCategory = '';
      if (mainCategoryMapping['alojamiento']?.includes(postData.category as ServiceCategory)) {
        mainCategory = 'alojamiento';
      } else if (mainCategoryMapping['alquiler-vehiculos']?.includes(postData.category as ServiceCategory)) {
        mainCategory = 'alquiler-vehiculos';
      } else if (mainCategoryMapping['clases-instructorados']?.includes(postData.category as ServiceCategory)) {
        mainCategory = 'clases-instructorados';
      }

      // Prepare images data
      const sortedImages = images.sort((a, b) => a.order - b.order);
      const mainImage = sortedImages[0]?.data || '';
      const additionalImages = sortedImages.slice(1).map(img => img.data);

      const initialFormData = {
        mainCategory,
        title: postData.title,
        description: postData.description,
        category: postData.category as ServiceCategory,
        location: postData.location,
        mainImage,
        images: additionalImages,
        specificFields: postData.specificFields || {}, // Prefill specific fields from post data
        pricing: {
          type: 'fixed',
          price: postData.price,
          currency: postData.currency
        } as FixedPricing,
        cancellationPolicies: [], // This would need to be populated from postData if we store it
        termsAccepted: true,
        isActive: postData.isActive,
      };


      setFormData(initialFormData);
      setCreatedPostId(postData.id);
    }
  }, [editMode, postData, images]);


  const updateFormData = (updates: Partial<PostFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle main category changes (only in create mode)
  const handleMainCategoryChange = (categoryId: string) => {
    if (editMode) {
      return; // Disable category changes in edit mode
    }
    
    // Always update the main category
    const updates: Partial<PostFormData> = { mainCategory: categoryId };
    
    // Only reset category and specific fields if changing to a different main category
    if (formData.mainCategory !== categoryId) {
      updates.category = ''; // Reset category when main category changes
      updates.specificFields = {}; // Reset specific fields
    }
    
    updateFormData(updates);
  };

  const getFilteredCategories = (): ServiceCategory[] => {
    if (!formData.mainCategory) return [];
    const categories = mainCategoryMapping[formData.mainCategory as keyof typeof mainCategoryMapping] || [];
    return categories as ServiceCategory[];
  };


  const addCancellationPolicy = () => {
    const newPolicy: CancellationPolicy = {
      id: generateId(),
      days_quantity: 0,
      cancellation_type: 'Fijo',
      cancellation_amount: 0,
    };
    updateFormData({
      cancellationPolicies: [...formData.cancellationPolicies, newPolicy]
    });
  };

  const removeCancellationPolicy = (policyId: string) => {
    updateFormData({
      cancellationPolicies: formData.cancellationPolicies.filter(policy => policy.id !== policyId)
    });
  };

  const updateCancellationPolicy = (policyId: string, updates: Partial<CancellationPolicy>) => {
    updateFormData({
      cancellationPolicies: formData.cancellationPolicies.map(policy =>
        policy.id === policyId ? { ...policy, ...updates } : policy
      )
    });
  };

  // Pricing functions
  const setPricingType = (type: 'fixed' | 'dynamic') => {
    if (type === 'fixed') {
      updateFormData({
        pricing: {
          type: 'fixed',
          price: 0,
          currency: 'EUR'
        }
      });
    } else {
      updateFormData({
        pricing: {
          type: 'dynamic',
          seasons: []
        }
      });
    }
  };

  const addSeason = () => {
    if (formData.pricing?.type === 'dynamic') {
      const newSeason: DynamicPricingSeason = {
        id: generateId(),
        startDate: '',
        endDate: '',
        price: 0,
        currency: 'EUR',
        weekdays: []
      };
      updateFormData({
        pricing: {
          ...formData.pricing,
          seasons: [...formData.pricing.seasons, newSeason]
        }
      });
    }
  };

  const removeSeason = (seasonId: string) => {
    if (formData.pricing?.type === 'dynamic') {
      updateFormData({
        pricing: {
          ...formData.pricing,
          seasons: formData.pricing.seasons.filter(season => season.id !== seasonId)
        }
      });
    }
  };

  const updateSeason = (seasonId: string, updates: Partial<DynamicPricingSeason>) => {
    if (formData.pricing?.type === 'dynamic') {
      updateFormData({
        pricing: {
          ...formData.pricing,
          seasons: formData.pricing.seasons.map(season =>
            season.id === seasonId ? { ...season, ...updates } : season
          )
        }
      });
    }
  };

  const toggleWeekday = (seasonId: string, weekday: Weekday) => {
    if (formData.pricing?.type === 'dynamic') {
      const season = formData.pricing.seasons.find(s => s.id === seasonId);
      if (season) {
        const weekdays = season.weekdays.includes(weekday)
          ? season.weekdays.filter(w => w !== weekday)
          : [...season.weekdays, weekday];
        updateSeason(seasonId, { weekdays });
      }
    }
  };

  // Image upload functions
  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageData = await fileToBase64(file, 2048); // 2MB max
        const compressedImage = await compressBase64Image(imageData.base64, 0.8, 1920, 1080);
        updateFormData({ mainImage: compressedImage });
      } catch (error) {
        console.error('Error processing main image:', error);
        setSubmitError('Error processing image. Please try again.');
      }
    }
  };

  const handleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      try {
        const imageDataArray = await filesToBase64(files, 2048); // 2MB max per image
        const compressedImages = await Promise.all(
          imageDataArray.map(data => compressBase64Image(data.base64, 0.8, 1920, 1080))
        );
        updateFormData({ images: [...formData.images, ...compressedImages] });
      } catch (error) {
        console.error('Error processing images:', error);
        setSubmitError('Error processing images. Please try again.');
      }
    }
  };

  const removeMainImage = () => {
    updateFormData({ mainImage: '' });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData({ images: newImages });
  };

  // Address selection handler
  const handleAddressSelect = (address: { display_name: string; lat: string; lon: string; place_id: string }) => {
    updateFormData({
      location: address.display_name,
      locationData: {
        lat: address.lat,
        lon: address.lon,
        place_id: address.place_id,
        display_name: address.display_name
      }
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setSubmitError('You must be logged in to create a post');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.category || !formData.location || !formData.mainImage) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.pricing) {
        throw new Error('Please configure pricing for your service');
      }

      // Prepare post data for database (without images)
      const postDataToSave = {
        title: formData.title,
        description: formData.description,
        category: formData.category as ServiceCategory,
        location: formData.location,
        specificFields: formData.specificFields, // Include specific fields
        cancellationPolicies: formData.cancellationPolicies, // Include cancellation policies
        isActive: formData.isActive,
        status: editMode ? (postData?.status || 'published') : 'published' as const,
        publisherId: user.id,
        userId: user.id,
        // Add pricing information to the post
        price: formData.pricing.type === 'fixed' ? formData.pricing.price : 0,
        currency: formData.pricing.type === 'fixed' ? formData.pricing.currency : 'EUR',
        // Additional fields for BasePost (only include if they have values)
        publishedAt: editMode ? postData?.publishedAt : new Date(),
      };

      // Combine main image and additional images
      const allImages = [formData.mainImage, ...formData.images].filter(Boolean);

      let postId: string;

      if (editMode && postData) {
        // Update existing post
        postId = postData.id;
        
        // Update post data
        await firebaseDB.posts.update(postId, postDataToSave);
        
        // Delete existing images and create new ones
        await firebaseDB.postImages.deleteAll(postId);
        if (allImages.length > 0) {
          await firebaseDB.postImages.createMultiple(postId, allImages);
        }
        
        console.log('Post updated successfully with ID:', postId);
      } else {
        // Create new post
        postId = await firebaseDB.posts.createWithImages(postDataToSave, allImages, user.id);
        console.log('Post created successfully with ID:', postId);
      }
      
      setCreatedPostId(postId);
      setSubmitSuccess(true);
      
      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        // Reset form after successful submission (only for create mode)
        setTimeout(() => {
          setFormData({
            mainCategory: '',
            title: '',
            description: '',
            category: '',
            location: '',
            mainImage: '',
            images: [],
            specificFields: {},
            pricing: null,
            cancellationPolicies: [],
            termsAccepted: false,
            isActive: true,
          });
          setCurrentStep(0);
          setSubmitSuccess(false);
        }, 3000);
      }

    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} post:`, error);
      setSubmitError(error instanceof Error ? error.message : `Failed to ${editMode ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMainCategoryStep = () => (
    <div key={`main-category-${formData.mainCategory}`} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {editMode ? '¿Qué tipo de servicio quieres actualizar?' : '¿Qué tipo de servicio quieres publicar?'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {editMode 
            ? 'La categoría principal no se puede modificar en modo edición'
            : 'Selecciona la categoría principal que mejor describa tu servicio'
          }
        </p>
        {formData.mainCategory && (
          <div className={`mt-4 p-3 border rounded-lg ${
            editMode 
              ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <p className={`text-sm ${
              editMode 
                ? 'text-gray-600 dark:text-gray-400' 
                : 'text-green-700 dark:text-green-300'
            }`}>
              <strong>
                {editMode ? 'Categoría actual (no modificable):' : 'Categoría seleccionada:'}
              </strong> {mainCategories.find(cat => cat.id === formData.mainCategory)?.title}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mainCategories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = formData.mainCategory === category.id;
          
          return (
            <div
              key={category.id}
              onClick={editMode ? undefined : () => handleMainCategoryChange(category.id)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                editMode 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'cursor-pointer hover:border-primary-brown/50 hover:shadow-md'
              } ${
                isSelected
                  ? 'border-primary-brown bg-gradient-to-br from-primary-brown/10 to-primary-green/10 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full transition-colors duration-300 ${
                  isSelected
                    ? 'bg-primary-brown text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isSelected
                      ? 'text-primary-brown'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-primary-brown rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInformationStep = () => {
    const fields = categoryFields[formData.category as keyof typeof categoryFields] || {};
    
    return (
      <div className="space-y-8">
        {/* Basic Information Section */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Información Básica
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título del Servicio *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                placeholder="Ej: Alquiler de Bicicletas de Montaña en Sierra Nevada"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                placeholder="Describe tu servicio en detalle..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateFormData({ category: e.target.value as ServiceCategory | '' })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                disabled={!formData.mainCategory}
              >
                <option value="">
                  {formData.mainCategory ? 'Selecciona una categoría' : 'Primero selecciona una categoría principal'}
                </option>
                {getFilteredCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="z-10">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ubicación *
              </label>
              <AddressSearch
                value={formData.location}
                onChange={(value) => updateFormData({ location: value })}
                onSelect={handleAddressSelect}
                placeholder="Buscar ubicación (ciudad, provincia, país)..."
                disabled={!formData.mainCategory}
              />
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="glass rounded-xl p-6 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Imágenes
          </h3>
          <div className="space-y-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagen Principal *
              </label>
              {formData.mainImage ? (
                <div className="relative">
                  <img
                    src={formData.mainImage}
                    alt="Imagen principal"
                    className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={removeMainImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Selecciona una imagen principal para tu servicio
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    className="hidden"
                    id="main-image-upload"
                  />
                  <label
                    htmlFor="main-image-upload"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Seleccionar Imagen
                  </label>
                </div>
              )}
            </div>

            {/* Additional Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imágenes Adicionales
              </label>
              <div className="space-y-4">
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                    Agrega más imágenes para mostrar tu servicio
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesUpload}
                    className="hidden"
                    id="images-upload"
                  />
                  <label
                    htmlFor="images-upload"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Imágenes
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specific Information Section */}
        {formData.category && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Información Específica
            </h3>
            <div className="space-y-6">
              {Object.entries(fields).map(([fieldName, options]) => (
                <div key={fieldName}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} *
                  </label>
                  <select
                    value={String(formData.specificFields[fieldName] || '')}
                    onChange={(e) => updateFormData({
                      specificFields: {
                        ...formData.specificFields,
                        [fieldName]: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                  >
                    <option value="">Seleccionar {fieldName}</option>
                    {options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Características y Servicios Checkboxes */}
              {formData.category && mainCategoryMapping['alojamiento']?.includes(formData.category as ServiceCategory) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Características y Servicios
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryAmenities[formData.category as keyof typeof categoryAmenities]?.map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.specificFields[amenity])}
                          onChange={(e) => updateFormData({
                            specificFields: {
                              ...formData.specificFields,
                              [amenity]: e.target.checked
                            }
                          })}
                          className="w-4 h-4 text-primary-brown border-gray-300 rounded focus:ring-primary-brown focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {amenity}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Common specific fields for all categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Incluye
                </label>
                <textarea
                  value={String(formData.specificFields.includes || '')}
                  onChange={(e) => updateFormData({
                    specificFields: {
                      ...formData.specificFields,
                      includes: e.target.value
                    }
                  })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                  placeholder="Qué incluye tu servicio? (separar por comas)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requisitos
                </label>
                <textarea
                  value={String(formData.specificFields.requirements || '')}
                  onChange={(e) => updateFormData({
                    specificFields: {
                      ...formData.specificFields,
                      requirements: e.target.value
                    }
                  })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                  placeholder="Qué requisitos necesitan los clientes? (separar por comas)"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderPricingStep = () => {
    const weekdays: { value: Weekday; label: string }[] = [
      { value: 'monday', label: 'Lunes' },
      { value: 'tuesday', label: 'Martes' },
      { value: 'wednesday', label: 'Miércoles' },
      { value: 'thursday', label: 'Jueves' },
      { value: 'friday', label: 'Viernes' },
      { value: 'saturday', label: 'Sábado' },
      { value: 'sunday', label: 'Domingo' }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Configura el Precio
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Elige si quieres un precio fijo o dinámico según temporadas
          </p>
        </div>

        {/* Pricing Type Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Tipo de Precio *
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fixed Pricing Option */}
            <button
              onClick={() => setPricingType('fixed')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                formData.pricing?.type === 'fixed'
                  ? 'border-primary-brown bg-gradient-to-br from-primary-brown/10 to-primary-green/10 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-brown/50 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full transition-colors duration-300 ${
                  formData.pricing?.type === 'fixed'
                    ? 'bg-primary-brown text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${
                  formData.pricing?.type === 'fixed'
                    ? 'text-primary-brown'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Precio Fijo
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Un precio único para todo el año
                </p>
              </div>
            </button>

            {/* Dynamic Pricing Option */}
            <button
              onClick={() => setPricingType('dynamic')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                formData.pricing?.type === 'dynamic'
                  ? 'border-primary-brown bg-gradient-to-br from-primary-brown/10 to-primary-green/10 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-brown/50 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full transition-colors duration-300 ${
                  formData.pricing?.type === 'dynamic'
                    ? 'bg-primary-brown text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${
                  formData.pricing?.type === 'dynamic'
                    ? 'text-primary-brown'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Precio Dinámico
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diferentes precios por temporadas y días
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Fixed Pricing Form */}
        {formData.pricing?.type === 'fixed' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Precio Fijo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio *
                </label>
                <input
                  type="number"
                  value={formData.pricing.price}
                  onChange={(e) => updateFormData({
                    pricing: {
                      ...formData.pricing,
                      price: parseFloat(e.target.value) || 0
                    } as FixedPricing
                  })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Moneda *
                </label>
                <select
                  value={formData.pricing.currency}
                  onChange={(e) => updateFormData({
                    pricing: {
                      ...formData.pricing,
                      currency: e.target.value
                    } as FixedPricing
                  })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="ARS">ARS ($)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Pricing Form */}
        {formData.pricing?.type === 'dynamic' && (
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Temporadas
              </h3>
              <button
                onClick={addSeason}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Temporada
              </button>
            </div>

            {formData.pricing.seasons.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-600 mb-2">
                  <Settings className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  No hay temporadas configuradas
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Haz clic en "Agregar Temporada" para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.pricing.seasons.map((season, index) => (
                  <div key={season.id} className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Temporada {index + 1}
                      </h4>
                      <button
                        onClick={() => removeSeason(season.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Precio *
                        </label>
                        <input
                          type="number"
                          value={season.price}
                          onChange={(e) => updateSeason(season.id, { price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha Desde *
                        </label>
                        <input
                          type="date"
                          value={season.startDate}
                          onChange={(e) => updateSeason(season.id, { startDate: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                        />
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha Hasta *
                        </label>
                        <input
                          type="date"
                          value={season.endDate}
                          onChange={(e) => updateSeason(season.id, { endDate: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Weekdays Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Días de la Semana *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {weekdays.map((weekday) => (
                          <label key={weekday.value} className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={season.weekdays.includes(weekday.value)}
                              onChange={() => toggleWeekday(season.id, weekday.value)}
                              className="w-4 h-4 text-primary-brown border-gray-300 rounded focus:ring-primary-brown focus:ring-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {weekday.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCancellationPoliciesStep = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Políticas de Cancelación
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Define las políticas de cancelación para tu servicio
            </p>
          </div>
          <button
            onClick={addCancellationPolicy}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Política
          </button>
        </div>

        {formData.cancellationPolicies.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <Settings className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No hay políticas de cancelación configuradas
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Haz clic en "Agregar Política" para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.cancellationPolicies.map((policy, index) => (
              <div key={policy.id} className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    Política {index + 1}
                  </h4>
                  <button
                    onClick={() => removeCancellationPolicy(policy.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Days Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Días antes de la cancelación *
                    </label>
                    <input
                      type="number"
                      value={policy.days_quantity}
                      onChange={(e) => updateCancellationPolicy(policy.id, { 
                        days_quantity: parseInt(e.target.value) || 0 
                      })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {/* Cancellation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de cancelación *
                    </label>
                    <select
                      value={policy.cancellation_type}
                      onChange={(e) => updateCancellationPolicy(policy.id, { 
                        cancellation_type: e.target.value as 'Fijo' | 'Porcentaje',
                        cancellation_amount: 0 // Reset amount when type changes
                      })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                    >
                      <option value="Fijo">Fijo</option>
                      <option value="Porcentaje">Porcentaje</option>
                    </select>
                  </div>

                  {/* Cancellation Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {policy.cancellation_type === 'Porcentaje' ? 'Porcentaje (%)' : 'Monto fijo'} *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={policy.cancellation_amount}
                        onChange={(e) => updateCancellationPolicy(policy.id, { 
                          cancellation_amount: parseFloat(e.target.value) || 0 
                        })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-brown focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        max={policy.cancellation_type === 'Porcentaje' ? 100 : undefined}
                        step="0.01"
                      />
                      {policy.cancellation_type === 'Porcentaje' && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Policy Description */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Descripción:</strong> Si se cancela con {policy.days_quantity} días o menos de anticipación, 
                    se cobrará {policy.cancellation_type === 'Porcentaje' 
                      ? `${policy.cancellation_amount}% del total` 
                      : `${policy.cancellation_amount}€`} como penalización.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTermsModal = () => {
    if (!showTermsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Términos y Condiciones de Publicación
            </h2>
            <button
              onClick={() => setShowTermsModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Marketplace Turismo - Términos y Condiciones de Publicación
              </h3>
              
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Aceptación de Términos</h4>
                  <p>
                    Al publicar un servicio en Marketplace Turismo, usted acepta cumplir con estos términos y condiciones. 
                    La publicación de contenido implica la aceptación total de estas condiciones.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Contenido y Responsabilidad</h4>
                  <p>
                    Usted es responsable de la veracidad y exactitud de toda la información publicada. 
                    Marketplace Turismo se reserva el derecho de moderar, editar o eliminar contenido que 
                    no cumpla con nuestras políticas de calidad.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. Políticas de Cancelación</h4>
                  <p>
                    Las políticas de cancelación que establezca deben ser claras y cumplibles. 
                    Usted es responsable de cumplir con las políticas publicadas y de comunicar 
                    cualquier cambio a los clientes con la debida antelación.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">4. Tarifas y Comisiones</h4>
                  <p>
                    Marketplace Turismo puede aplicar comisiones sobre las transacciones realizadas 
                    a través de la plataforma. Las tarifas aplicables serán comunicadas antes de 
                    la confirmación de cualquier reserva.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">5. Moderación de Contenido</h4>
                  <p>
                    Todo el contenido está sujeto a revisión y moderación. Marketplace Turismo 
                    se reserva el derecho de rechazar, suspender o eliminar publicaciones que 
                    no cumplan con nuestros estándares de calidad y políticas de la plataforma.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">6. Responsabilidad del Proveedor</h4>
                  <p>
                    Como proveedor de servicios, usted es responsable de cumplir con todas las 
                    leyes y regulaciones aplicables, mantener seguros a los clientes y proporcionar 
                    los servicios descritos en su publicación.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">7. Modificaciones</h4>
                  <p>
                    Marketplace Turismo se reserva el derecho de modificar estos términos en 
                    cualquier momento. Los cambios serán notificados a través de la plataforma 
                    y entrarán en vigor inmediatamente.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">8. Contacto</h4>
                  <p>
                    Para cualquier consulta sobre estos términos y condiciones, puede contactarnos 
                    a través de los canales oficiales de Marketplace Turismo.
                  </p>
                </section>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowTermsModal(false)}
              className="px-6 py-2 bg-gradient-to-r from-primary-brown to-primary-green text-white rounded-lg hover:from-secondary-brown hover:to-secondary-green transition-all duration-300"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderReviewStep = () => {
    const selectedMainCategory = mainCategories.find(cat => cat.id === formData.mainCategory);
    
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Categoría Principal
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría:</span>
              <p className="text-gray-900 dark:text-white">{selectedMainCategory?.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción:</span>
              <p className="text-gray-900 dark:text-white">{selectedMainCategory?.description}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Información Básica
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Título:</span>
              <p className="text-gray-900 dark:text-white">{formData.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría:</span>
              <p className="text-gray-900 dark:text-white">{formData.category}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación:</span>
              <p className="text-gray-900 dark:text-white">{formData.location}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción:</span>
              <p className="text-gray-900 dark:text-white">{formData.description}</p>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Imágenes
          </h3>
          <div className="space-y-4">
            {createdPostId ? (
              // Show images from subcollection if post has been created
              <PostImages 
                postId={createdPostId} 
                className="w-full"
                showMainImageOnly={false}
                showGallery={true}
              />
            ) : (
              // Show preview images from form data
              <>
                {/* Main Image */}
                {formData.mainImage && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                      Imagen Principal:
                    </span>
                    <img
                      src={formData.mainImage}
                      alt="Imagen principal"
                      className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                )}

                {/* Additional Images */}
                {formData.images.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                      Imágenes Adicionales ({formData.images.length}):
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Información Específica
          </h3>
          <div className="space-y-3">
            {Object.entries(formData.specificFields).map(([key, value]) => {
              // Skip boolean values (characteristics) as they'll be shown separately
              if (typeof value === 'boolean') return null;
              
              return (
                <div key={key}>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </span>
                  <p className="text-gray-900 dark:text-white">{String(value)}</p>
                </div>
              );
            })}
          </div>
          
          {/* Características y Servicios for Alojamiento categories */}
          {formData.category && mainCategoryMapping['alojamiento']?.includes(formData.category as ServiceCategory) && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                Características y Servicios
              </h4>
              <div className="space-y-2">
                {categoryAmenities[formData.category as keyof typeof categoryAmenities]?.map((amenity) => {
                  const isSelected = formData.specificFields[amenity] === true;
                  if (!isSelected) return null;
                  
                  return (
                    <div key={amenity} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-brown rounded-full"></div>
                      <span className="text-gray-900 dark:text-white">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* Pricing Section */}
        {formData.pricing && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Precio
            </h3>
            <div className="space-y-4">
              {formData.pricing.type === 'fixed' ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo:</span>
                    <p className="text-gray-900 dark:text-white">Precio Fijo</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Precio:</span>
                    <p className="text-gray-900 dark:text-white">
                      {formData.pricing.price} {formData.pricing.currency}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo:</span>
                    <p className="text-gray-900 dark:text-white">Precio Dinámico</p>
                  </div>
                  {formData.pricing.seasons.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Temporadas:</span>
                      {formData.pricing.seasons.map((season, index) => (
                        <div key={season.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Temporada {index + 1}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <strong>Precio:</strong> {season.price} {season.currency}
                            </div>
                            <div>
                              <strong>Período:</strong> {season.startDate} - {season.endDate}
                            </div>
                            <div className="md:col-span-2">
                              <strong>Días:</strong> {season.weekdays.length > 0 
                                ? season.weekdays.map(w => {
                                    const weekdays: Record<Weekday, string> = {
                                      monday: 'Lunes',
                                      tuesday: 'Martes',
                                      wednesday: 'Miércoles',
                                      thursday: 'Jueves',
                                      friday: 'Viernes',
                                      saturday: 'Sábado',
                                      sunday: 'Domingo'
                                    };
                                    return weekdays[w];
                                  }).join(', ')
                                : 'No especificado'
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No hay temporadas configuradas</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancellation Policies Section */}
        {formData.cancellationPolicies.length > 0 && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Políticas de Cancelación
            </h3>
            <div className="space-y-3">
              {formData.cancellationPolicies.map((policy, index) => (
                <div key={policy.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Política {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cancelación con {policy.days_quantity} días o menos: {policy.cancellation_type === 'Porcentaje' 
                      ? `${policy.cancellation_amount}% del total` 
                      : `${policy.cancellation_amount}€`} de penalización
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estado de Publicación
          </h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateFormData({ isActive: e.target.checked })}
                className="w-4 h-4 text-primary-brown border-gray-300 rounded focus:ring-primary-brown focus:ring-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Publicar inmediatamente
              </span>
            </label>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
                  className="w-4 h-4 text-primary-brown border-gray-300 rounded focus:ring-primary-brown focus:ring-2 mt-0.5"
                  required
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Al publicar acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-primary-brown hover:text-secondary-brown underline focus:outline-none focus:ring-2 focus:ring-primary-brown focus:ring-offset-2 rounded"
                  >
                    términos y condiciones de publicación de Marketplace Turismo
                  </button>
                </span>
              </label>
              {!formData.termsAccepted && (
                <p className="text-red-500 text-xs mt-1 ml-7">
                  Debe aceptar los términos y condiciones para continuar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderMainCategoryStep();
      case 1:
        return renderInformationStep();
      case 2:
        return renderPricingStep();
      case 3:
        return renderCancellationPoliciesStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentStep
                  ? 'bg-primary-brown border-primary-brown text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  index <= currentStep
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-primary-brown' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass rounded-xl p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step-${currentStep}-${formData.mainCategory}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>

          {currentStep === steps.length - 1 ? (
            <div className="flex flex-col items-end space-y-2">
              {submitError && (
                <div className="text-red-500 text-sm text-right max-w-xs">
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="text-green-500 text-sm text-right max-w-xs">
                  ¡{editMode ? 'Post actualizado' : 'Post creado'} exitosamente! {onSuccess ? 'Redirigiendo...' : ''}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!formData.termsAccepted || isSubmitting}
                className={`flex items-center px-6 py-2 rounded-lg transition-all duration-300 ${
                  !formData.termsAccepted || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-brown to-primary-green text-white hover:from-secondary-brown hover:to-secondary-green'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editMode ? 'Actualizando...' : 'Publicando...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {editMode ? 'Actualizar' : 'Publicar'}
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 0 && !formData.mainCategory) ||
                (currentStep === 1 && (!formData.category || !formData.mainImage)) ||
                (currentStep === 2 && !formData.pricing)
              }
              className={`flex items-center px-6 py-2 rounded-lg transition-all duration-300 ${
                (currentStep === 0 && !formData.mainCategory) ||
                (currentStep === 1 && (!formData.category || !formData.mainImage)) ||
                (currentStep === 2 && !formData.pricing)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-brown to-primary-green text-white hover:from-secondary-brown hover:to-secondary-green'
              }`}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
      
      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {renderTermsModal()}
      </AnimatePresence>
    </div>
  );
} 