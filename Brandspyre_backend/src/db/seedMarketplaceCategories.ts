import mongoose from 'mongoose';
import {
  MarketplaceCategory,
  CategoryFormSchema
} from './ModelSceham/marketplaceCategorySchema';

export const SEED_CATEGORIES = [
  {
    category: {
      code: 'RETAIL_COMMERCE',
      name: 'Retail, Consumer Goods & Ecommerce',
      description: 'Physical consumer products, apparel, electronics, packaged goods, and retail merchandise.',
      icon: 'ShoppingBag',
      display_order: 1,
      is_active: true,
      listing_types: ['PRODUCT_SALE', 'CLEARANCE', 'PREORDER'],
      default_listing_type: 'PRODUCT_SALE',
      pricing_modes: ['FIXED', 'NEGOTIABLE'],
      default_pricing_mode: 'FIXED',
      pricing_units: ['PER_UNIT', 'PER_PACK', 'PER_SET'],
      default_pricing_unit: 'PER_UNIT',
      transaction_flow: 'ECOMMERCE',
      requires_product_link: true, // ERP physical product linked
      requires_location: false,
      allow_instant_booking: false,
      media_requirements: { min_images: 1, max_images: 10, allow_video: true, allow_documents: false }
    },
    schemaFields: [
      { key: 'brand', label: 'Brand / Manufacturer', type: 'text', required: false, group: 'Product Overview', display_order: 1 },
      { key: 'warranty_period', label: 'Warranty Period', type: 'select', required: false, group: 'Product Overview', display_order: 2, options: [
        { label: 'No Warranty', value: 'None' },
        { label: '6 Months', value: '6 Months' },
        { label: '1 Year', value: '1 Year' },
        { label: '2 Years', value: '2 Years' },
        { label: 'Lifetime Warranty', value: 'Lifetime' }
      ]},
      { key: 'return_window', label: 'Return Policy', type: 'select', required: false, group: 'Product Overview', display_order: 3, options: [
        { label: 'No Returns', value: 'No Returns' },
        { label: '7 Days Replacement', value: '7 Days Replacement' },
        { label: '10 Days Return/Refund', value: '10 Days Return' },
        { label: '30 Days Money Back', value: '30 Days Return' }
      ]},
      { key: 'box_contents', label: 'What is inside the box?', type: 'textarea', required: false, group: 'Specifications', display_order: 4 }
    ]
  },
  {
    category: {
      code: 'REAL_ESTATE',
      name: 'Real Estate, Housing & Property',
      description: 'Residential apartments, luxury villas, commercial offices, retail shops, plots, and land developments.',
      icon: 'Home',
      display_order: 2,
      is_active: true,
      listing_types: ['PROPERTY_SALE', 'PROPERTY_RENT', 'COMMERCIAL_LEASE', 'PLOT_SALE'],
      default_listing_type: 'PROPERTY_SALE',
      pricing_modes: ['FIXED', 'NEGOTIABLE', 'PRICE_ON_REQUEST'],
      default_pricing_mode: 'NEGOTIABLE',
      pricing_units: ['TOTAL_PRICE', 'PER_MONTH', 'PER_SQFT', 'PER_ACRE'],
      default_pricing_unit: 'TOTAL_PRICE',
      transaction_flow: 'ENQUIRY',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: false,
      media_requirements: { min_images: 3, max_images: 20, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'property_type', label: 'Property Type', type: 'select', required: true, group: 'Overview', display_order: 1, options: [
        { label: 'Apartment / Flat', value: 'Apartment' },
        { label: 'Independent Villa / House', value: 'Villa' },
        { label: 'Commercial Office Space', value: 'Office' },
        { label: 'Retail Shop / Showroom', value: 'Shop' },
        { label: 'Plot / Land', value: 'Plot' },
        { label: 'Warehouse / Industrial Shed', value: 'Warehouse' }
      ]},
      { key: 'bedrooms', label: 'Bedrooms (BHK)', type: 'select', required: false, group: 'Overview', display_order: 2, options: [
        { label: '1 RK / Studio', value: '1 RK' },
        { label: '1 BHK', value: '1 BHK' },
        { label: '2 BHK', value: '2 BHK' },
        { label: '3 BHK', value: '3 BHK' },
        { label: '4 BHK', value: '4 BHK' },
        { label: '5+ BHK', value: '5+ BHK' }
      ]},
      { key: 'bathrooms', label: 'Bathrooms', type: 'number', required: false, group: 'Overview', display_order: 3 },
      { key: 'carpet_area', label: 'Carpet Area (sq.ft)', type: 'number', required: true, group: 'Dimensions', display_order: 4 },
      { key: 'super_builtup_area', label: 'Super Built-up Area (sq.ft)', type: 'number', required: false, group: 'Dimensions', display_order: 5 },
      { key: 'furnishing', label: 'Furnishing Status', type: 'select', required: true, group: 'Overview', display_order: 6, options: [
        { label: 'Fully Furnished', value: 'Furnished' },
        { label: 'Semi-Furnished', value: 'Semi-Furnished' },
        { label: 'Unfurnished', value: 'Unfurnished' }
      ]},
      { key: 'possession_status', label: 'Possession Status', type: 'select', required: true, group: 'Overview', display_order: 7, options: [
        { label: 'Ready to Move', value: 'Ready to Move' },
        { label: 'Under Construction', value: 'Under Construction' },
        { label: 'Pre-Launch / Booking', value: 'Pre-Launch' }
      ]},
      { key: 'floor_number', label: 'Floor Number', type: 'number', required: false, group: 'Building Info', display_order: 8 },
      { key: 'total_floors', label: 'Total Floors in Building', type: 'number', required: false, group: 'Building Info', display_order: 9 },
      { key: 'facing', label: 'Facing Direction', type: 'select', required: false, group: 'Building Info', display_order: 10, options: [
        { label: 'North', value: 'North' },
        { label: 'East', value: 'East' },
        { label: 'North-East', value: 'North-East' },
        { label: 'West', value: 'West' },
        { label: 'South', value: 'South' }
      ]},
      { key: 'amenities', label: 'Amenities', type: 'tags', required: false, group: 'Features', display_order: 11, placeholder: 'Gym, Swimming Pool, 24/7 Security, Lift, Covered Parking' }
    ]
  },
  {
    category: {
      code: 'AUTOMOBILES',
      name: 'Automobiles & Vehicles',
      description: 'New and certified pre-owned cars, motorcycles, commercial trucks, EVs, and self-drive rentals.',
      icon: 'Car',
      display_order: 3,
      is_active: true,
      listing_types: ['VEHICLE_SALE', 'VEHICLE_RENTAL', 'TEST_DRIVE_OFFER'],
      default_listing_type: 'VEHICLE_SALE',
      pricing_modes: ['FIXED', 'NEGOTIABLE', 'STARTING_FROM'],
      default_pricing_mode: 'NEGOTIABLE',
      pricing_units: ['TOTAL_PRICE', 'PER_DAY', 'PER_WEEK', 'PER_MONTH'],
      default_pricing_unit: 'TOTAL_PRICE',
      transaction_flow: 'ENQUIRY',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: false,
      media_requirements: { min_images: 4, max_images: 20, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'make', label: 'Make / Brand', type: 'text', required: true, group: 'Vehicle Specs', display_order: 1, placeholder: 'e.g. Hyundai, Toyota, BMW' },
      { key: 'model', label: 'Model', type: 'text', required: true, group: 'Vehicle Specs', display_order: 2, placeholder: 'e.g. Creta, Fortuner, 3 Series' },
      { key: 'variant', label: 'Variant / Trim', type: 'text', required: false, group: 'Vehicle Specs', display_order: 3, placeholder: 'e.g. SX (O) Turbo' },
      { key: 'year', label: 'Manufacturing Year', type: 'number', required: true, group: 'Vehicle Specs', display_order: 4, validation: { min: 1990, max: 2027 } },
      { key: 'mileage_km', label: 'Odometer Reading (KM)', type: 'number', required: true, group: 'Vehicle Specs', display_order: 5 },
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', required: true, group: 'Performance', display_order: 6, options: [
        { label: 'Petrol', value: 'Petrol' },
        { label: 'Diesel', value: 'Diesel' },
        { label: 'Electric (EV)', value: 'Electric' },
        { label: 'CNG / Hybrid', value: 'CNG' }
      ]},
      { key: 'transmission', label: 'Transmission', type: 'select', required: true, group: 'Performance', display_order: 7, options: [
        { label: 'Manual', value: 'Manual' },
        { label: 'Automatic (AT / DCT / CVT)', value: 'Automatic' }
      ]},
      { key: 'owners_count', label: 'Number of Owners', type: 'select', required: true, group: 'Ownership & Legal', display_order: 8, options: [
        { label: '1st Owner', value: '1' },
        { label: '2nd Owner', value: '2' },
        { label: '3rd Owner', value: '3' },
        { label: '4+ Owners', value: '4+' }
      ]},
      { key: 'rto_state', label: 'Registration State / RTO', type: 'text', required: false, group: 'Ownership & Legal', display_order: 9, placeholder: 'e.g. MH02, DL01, KA03' },
      { key: 'insurance_validity', label: 'Insurance Valid Until', type: 'date', required: false, group: 'Ownership & Legal', display_order: 10 }
    ]
  },
  {
    category: {
      code: 'MANUFACTURING_B2B',
      name: 'Manufacturing, Industrial & Wholesale',
      description: 'Raw materials, industrial machinery, wholesale merchandise, chemicals, packaging, and custom fabrication.',
      icon: 'Factory',
      display_order: 4,
      is_active: true,
      listing_types: ['B2B_SUPPLY', 'CUSTOM_MANUFACTURING', 'WHOLESALE_LOT'],
      default_listing_type: 'B2B_SUPPLY',
      pricing_modes: ['FIXED', 'NEGOTIABLE', 'PRICE_ON_REQUEST'],
      default_pricing_mode: 'NEGOTIABLE',
      pricing_units: ['PER_KG', 'PER_TON', 'PER_PIECE', 'PER_BOX', 'PER_CONTAINER'],
      default_pricing_unit: 'PER_PIECE',
      transaction_flow: 'RFQ',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: false,
      media_requirements: { min_images: 2, max_images: 15, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'moq', label: 'Minimum Order Quantity (MOQ)', type: 'number', required: true, group: 'B2B Procurement', display_order: 1 },
      { key: 'supply_capacity', label: 'Monthly Supply Capacity', type: 'text', required: false, group: 'B2B Procurement', display_order: 2, placeholder: 'e.g. 50,000 units/month' },
      { key: 'lead_time_days', label: 'Production Lead Time (Days)', type: 'number', required: false, group: 'B2B Procurement', display_order: 3 },
      { key: 'hsn_code', label: 'HSN / SAC Code', type: 'text', required: false, group: 'Compliance', display_order: 4 },
      { key: 'material_composition', label: 'Material Grade / Composition', type: 'text', required: false, group: 'Technical Specs', display_order: 5 },
      { key: 'certifications', label: 'Certifications', type: 'tags', required: false, group: 'Compliance', display_order: 6, placeholder: 'ISO 9001, CE, FDA, RoHS, GMP' },
      { key: 'sample_policy', label: 'Sample Availability', type: 'select', required: false, group: 'B2B Procurement', display_order: 7, options: [
        { label: 'Free samples on request', value: 'Free' },
        { label: 'Paid samples available', value: 'Paid' },
        { label: 'No samples offered', value: 'None' }
      ]}
    ]
  },
  {
    category: {
      code: 'TRAVEL_TOURISM',
      name: 'Travel, Tourism & Hospitality',
      description: 'Curated holiday packages, luxury resorts, boutique homestays, trekking expeditions, and corporate retreats.',
      icon: 'Compass',
      display_order: 5,
      is_active: true,
      listing_types: ['TOUR_PACKAGE', 'HOTEL_STAY', 'EXPERIENCE_ACTIVITY'],
      default_listing_type: 'TOUR_PACKAGE',
      pricing_modes: ['FIXED', 'STARTING_FROM'],
      default_pricing_mode: 'STARTING_FROM',
      pricing_units: ['PER_PERSON', 'PER_NIGHT', 'PER_COUPLE', 'TOTAL_PACKAGE'],
      default_pricing_unit: 'PER_PERSON',
      transaction_flow: 'BOOKING',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: true,
      media_requirements: { min_images: 3, max_images: 20, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'duration_days', label: 'Duration (Days)', type: 'number', required: true, group: 'Itinerary Overview', display_order: 1 },
      { key: 'duration_nights', label: 'Duration (Nights)', type: 'number', required: true, group: 'Itinerary Overview', display_order: 2 },
      { key: 'departure_city', label: 'Starting / Pick-up City', type: 'text', required: false, group: 'Itinerary Overview', display_order: 3 },
      { key: 'max_group_size', label: 'Max Group Size', type: 'number', required: false, group: 'Itinerary Overview', display_order: 4 },
      { key: 'inclusions', label: 'Inclusions', type: 'tags', required: false, group: 'Package Details', display_order: 5, placeholder: 'Breakfast, Airport Transfers, Sightseeing, 4-Star Stay' },
      { key: 'exclusions', label: 'Exclusions', type: 'tags', required: false, group: 'Package Details', display_order: 6, placeholder: 'Airfare, Personal Expenses, Visa fees' },
      { key: 'cancellation_policy', label: 'Cancellation & Refund Terms', type: 'textarea', required: false, group: 'Terms', display_order: 7 }
    ]
  },
  {
    category: {
      code: 'PROFESSIONAL_SERVICES',
      name: 'Professional & Business Services',
      description: 'Chartered accountants, legal advocates, software consultants, management advisors, and audit firms.',
      icon: 'Briefcase',
      display_order: 6,
      is_active: true,
      listing_types: ['CONSULTING_SESSION', 'FIXED_ENGAGEMENT', 'MONTHLY_RETAINER'],
      default_listing_type: 'FIXED_ENGAGEMENT',
      pricing_modes: ['FIXED', 'STARTING_FROM', 'PRICE_ON_REQUEST'],
      default_pricing_mode: 'STARTING_FROM',
      pricing_units: ['PER_HOUR', 'PER_SESSION', 'PER_MONTH', 'FIXED_PROJECT'],
      default_pricing_unit: 'FIXED_PROJECT',
      transaction_flow: 'ENQUIRY',
      requires_product_link: false,
      requires_location: false,
      allow_instant_booking: false,
      media_requirements: { min_images: 1, max_images: 10, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'practice_area', label: 'Practice Domain', type: 'select', required: true, group: 'Expertise', display_order: 1, options: [
        { label: 'Taxation & GST Filing', value: 'Taxation' },
        { label: 'Company Registration & Corporate Law', value: 'Corporate Law' },
        { label: 'Intellectual Property (Trademarks/Patents)', value: 'IP Law' },
        { label: 'Software Architecture & Cloud Consulting', value: 'Tech Consulting' },
        { label: 'Business Strategy & M&A', value: 'Business Strategy' },
        { label: 'HR & Talent Advisory', value: 'HR Advisory' }
      ]},
      { key: 'experience_years', label: 'Years of Experience', type: 'number', required: false, group: 'Expertise', display_order: 2 },
      { key: 'mode_of_delivery', label: 'Consultation Mode', type: 'select', required: true, group: 'Delivery', display_order: 3, options: [
        { label: 'Online Video Call', value: 'Online' },
        { label: 'In-Person / Office Visit', value: 'In-Person' },
        { label: 'Hybrid (Online & On-Site)', value: 'Hybrid' }
      ]},
      { key: 'deliverables_summary', label: 'Scope of Deliverables', type: 'textarea', required: false, group: 'Delivery', display_order: 4 }
    ]
  },
  {
    category: {
      code: 'FREELANCERS_CREATIVE',
      name: 'Freelancers, Creative & Digital Gigs',
      description: 'UI/UX designers, video editors, 3D animators, content strategists, and freelance developers.',
      icon: 'Palette',
      display_order: 7,
      is_active: true,
      listing_types: ['PROJECT_GIG', 'HOURLY_CONTRACT', 'CUSTOM_COMMISSION'],
      default_listing_type: 'PROJECT_GIG',
      pricing_modes: ['FIXED', 'STARTING_FROM', 'NEGOTIABLE'],
      default_pricing_mode: 'STARTING_FROM',
      pricing_units: ['FIXED_PROJECT', 'PER_HOUR', 'PER_DAY'],
      default_pricing_unit: 'FIXED_PROJECT',
      transaction_flow: 'ENQUIRY',
      requires_product_link: false,
      requires_location: false,
      allow_instant_booking: false,
      media_requirements: { min_images: 2, max_images: 15, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'creative_skill', label: 'Creative Specialty', type: 'select', required: true, group: 'Discipline', display_order: 1, options: [
        { label: 'UI/UX & Product Design', value: 'UI/UX' },
        { label: 'Branding & Logo Identity', value: 'Branding' },
        { label: 'Video Editing & Motion Graphics', value: 'Video Editing' },
        { label: 'Full-Stack Web & Mobile App Development', value: 'Development' },
        { label: 'Copywriting & Content Strategy', value: 'Copywriting' },
        { label: '3D Modeling & CGI', value: '3D Art' }
      ]},
      { key: 'turnaround_days', label: 'Typical Delivery Time (Days)', type: 'number', required: true, group: 'Turnaround', display_order: 2 },
      { key: 'revisions_included', label: 'Revisions Included', type: 'select', required: true, group: 'Turnaround', display_order: 3, options: [
        { label: '1 Revision', value: '1' },
        { label: '2 Revisions', value: '2' },
        { label: '3 Revisions', value: '3' },
        { label: 'Unlimited Revisions', value: 'Unlimited' }
      ]},
      { key: 'portfolio_link', label: 'Portfolio URL / Behance / GitHub', type: 'text', required: false, group: 'Showcase', display_order: 4 }
    ]
  },
  {
    category: {
      code: 'HOME_SERVICES',
      name: 'Home Services & Maintenance',
      description: 'Plumbing, electrical repairs, deep home cleaning, HVAC AC maintenance, painting, and pest control.',
      icon: 'Wrench',
      display_order: 8,
      is_active: true,
      listing_types: ['SERVICE_VISIT', 'PACKAGE_SERVICE', 'AMC_CONTRACT'],
      default_listing_type: 'SERVICE_VISIT',
      pricing_modes: ['FIXED', 'STARTING_FROM'],
      default_pricing_mode: 'STARTING_FROM',
      pricing_units: ['PER_VISIT', 'PER_HOUR', 'PER_ROOM', 'PER_SQFT'],
      default_pricing_unit: 'PER_VISIT',
      transaction_flow: 'BOOKING',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: true,
      media_requirements: { min_images: 1, max_images: 10, allow_video: false, allow_documents: false }
    },
    schemaFields: [
      { key: 'service_type', label: 'Service Category', type: 'select', required: true, group: 'Service Details', display_order: 1, options: [
        { label: 'Electrician & Wiring', value: 'Electrician' },
        { label: 'Plumbing & Sanitary Works', value: 'Plumbing' },
        { label: 'AC Service & Installation', value: 'AC Maintenance' },
        { label: 'Home Deep Cleaning', value: 'Cleaning' },
        { label: 'Pest Control', value: 'Pest Control' },
        { label: 'Carpentry & Furniture Assembly', value: 'Carpentry' },
        { label: 'Painting & Waterproofing', value: 'Painting' }
      ]},
      { key: 'emergency_support', label: '24/7 Emergency Service Available?', type: 'checkbox', required: false, group: 'Availability', display_order: 2 },
      { key: 'inspection_fee', label: 'Visiting / Diagnostic Charge (₹)', type: 'currency', required: false, group: 'Pricing Breakdown', display_order: 3 },
      { key: 'service_guarantee_days', label: 'Service Guarantee (Days)', type: 'number', required: false, group: 'Warranty', display_order: 4, placeholder: 'e.g. 30' }
    ]
  },
  {
    category: {
      code: 'HEALTHCARE_WELLNESS',
      name: 'Healthcare, Wellness & Fitness',
      description: 'Doctor consultations, diagnostic clinics, yoga masters, personal fitness training, and wellness spas.',
      icon: 'Activity',
      display_order: 9,
      is_active: true,
      listing_types: ['CLINIC_APPOINTMENT', 'TELECONSULTATION', 'FITNESS_MEMBERSHIP'],
      default_listing_type: 'CLINIC_APPOINTMENT',
      pricing_modes: ['FIXED', 'STARTING_FROM'],
      default_pricing_mode: 'FIXED',
      pricing_units: ['PER_SESSION', 'PER_MONTH', 'PER_CONSULTATION'],
      default_pricing_unit: 'PER_CONSULTATION',
      transaction_flow: 'BOOKING',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: true,
      media_requirements: { min_images: 1, max_images: 10, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'specialization', label: 'Medical Specialization / Discipline', type: 'text', required: true, group: 'Credentials', display_order: 1, placeholder: 'e.g. Cardiology, Dermatology, Physiotherapy, Yoga' },
      { key: 'qualifications', label: 'Doctor / Trainer Qualifications', type: 'text', required: false, group: 'Credentials', display_order: 2, placeholder: 'e.g. MBBS, MD, Certified ACE Trainer' },
      { key: 'consultation_type', label: 'Consultation Mode', type: 'select', required: true, group: 'Session Format', display_order: 3, options: [
        { label: 'In-Clinic Physical Visit', value: 'In-Clinic' },
        { label: 'Video Teleconsultation', value: 'Teleconsultation' },
        { label: 'Home Visit Consultation', value: 'Home Visit' }
      ]},
      { key: 'session_duration_mins', label: 'Session Duration (Minutes)', type: 'number', required: false, group: 'Session Format', display_order: 4, default_value: 30 }
    ]
  },
  {
    category: {
      code: 'EDUCATION_TRAINING',
      name: 'Education, Coaching & Training',
      description: 'Professional bootcamps, school & college tuition, language academies, skill certifications, and music lessons.',
      icon: 'GraduationCap',
      display_order: 10,
      is_active: true,
      listing_types: ['COURSE_ENROLLMENT', 'PRIVATE_TUTORING', 'WORKSHOP_TICKET'],
      default_listing_type: 'COURSE_ENROLLMENT',
      pricing_modes: ['FIXED', 'STARTING_FROM'],
      default_pricing_mode: 'FIXED',
      pricing_units: ['PER_COURSE', 'PER_MONTH', 'PER_HOUR', 'PER_TICKET'],
      default_pricing_unit: 'PER_COURSE',
      transaction_flow: 'BOOKING',
      requires_product_link: false,
      requires_location: false,
      allow_instant_booking: true,
      media_requirements: { min_images: 2, max_images: 10, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'target_audience', label: 'Target Audience / Level', type: 'select', required: true, group: 'Curriculum', display_order: 1, options: [
        { label: 'Beginner / Foundation', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Advanced / Working Professionals', value: 'Advanced' },
        { label: 'Kids & School Students', value: 'K-12' }
      ]},
      { key: 'learning_mode', label: 'Class Format', type: 'select', required: true, group: 'Format', display_order: 2, options: [
        { label: 'Live Online Interactive Batch', value: 'Live Online' },
        { label: 'Self-Paced Recorded Videos', value: 'Recorded' },
        { label: 'In-Person Classroom Training', value: 'Classroom' },
        { label: '1-on-1 Mentorship', value: '1-on-1' }
      ]},
      { key: 'duration_weeks', label: 'Total Duration (Weeks)', type: 'number', required: false, group: 'Format', display_order: 3 },
      { key: 'certificate_provided', label: 'Provides Certificate of Completion', type: 'checkbox', required: false, group: 'Certification', display_order: 4 }
    ]
  },
  {
    category: {
      code: 'EVENTS_EXPERIENCES',
      name: 'Events, Entertainment & Experiences',
      description: 'Wedding venues, live bands, event photographers, caterers, conference halls, and party entertainers.',
      icon: 'Calendar',
      display_order: 11,
      is_active: true,
      listing_types: ['VENUE_HIRE', 'EVENT_SERVICE', 'TICKETED_EXPERIENCE'],
      default_listing_type: 'VENUE_HIRE',
      pricing_modes: ['FIXED', 'NEGOTIABLE', 'STARTING_FROM'],
      default_pricing_mode: 'STARTING_FROM',
      pricing_units: ['PER_DAY', 'PER_EVENT', 'PER_PERSON', 'PER_HOUR'],
      default_pricing_unit: 'PER_EVENT',
      transaction_flow: 'BOOKING',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: false,
      media_requirements: { min_images: 4, max_images: 20, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'event_type', label: 'Event Focus', type: 'multiselect', required: true, group: 'Overview', display_order: 1, options: [
        { label: 'Weddings & Receptions', value: 'Wedding' },
        { label: 'Corporate Conferences & Seminars', value: 'Corporate' },
        { label: 'Birthdays & Private Parties', value: 'Birthday' },
        { label: 'Concerts & Live Shows', value: 'Concert' },
        { label: 'Photoshoots & Ad Shoots', value: 'Photoshoot' }
      ]},
      { key: 'max_capacity_guests', label: 'Guest Capacity (Max Persons)', type: 'number', required: false, group: 'Venue Specs', display_order: 2 },
      { key: 'indoor_outdoor', label: 'Setting', type: 'select', required: false, group: 'Venue Specs', display_order: 3, options: [
        { label: 'Indoor AC Banquet', value: 'Indoor' },
        { label: 'Outdoor Lawn / Open Air', value: 'Outdoor' },
        { label: 'Both Indoor & Lawn Options', value: 'Both' }
      ]},
      { key: 'parking_capacity', label: 'Parking Space (Cars)', type: 'number', required: false, group: 'Venue Specs', display_order: 4 }
    ]
  },
  {
    category: {
      code: 'DINING_FOOD',
      name: 'Dining, Catering & Cloud Kitchens',
      description: 'Gourmet catering for large gatherings, table dining experiences, institutional canteens, and bulk corporate meal boxes.',
      icon: 'Utensils',
      display_order: 12,
      is_active: true,
      listing_types: ['CATERING_ORDER', 'BULK_MEAL_PLAN', 'PRIVATE_CHEF_BOOKING'],
      default_listing_type: 'CATERING_ORDER',
      pricing_modes: ['FIXED', 'NEGOTIABLE', 'STARTING_FROM'],
      default_pricing_mode: 'STARTING_FROM',
      pricing_units: ['PER_PLATE', 'PER_PERSON', 'PER_DAY', 'TOTAL_EVENT'],
      default_pricing_unit: 'PER_PLATE',
      transaction_flow: 'ENQUIRY',
      requires_product_link: false,
      requires_location: true,
      allow_instant_booking: false,
      media_requirements: { min_images: 2, max_images: 15, allow_video: true, allow_documents: true }
    },
    schemaFields: [
      { key: 'cuisines', label: 'Cuisines Offered', type: 'tags', required: true, group: 'Menu Info', display_order: 1, placeholder: 'North Indian, South Indian, Mughlai, Chinese, Continental, Italian' },
      { key: 'dietary_specialties', label: 'Dietary Preferences', type: 'multiselect', required: true, group: 'Menu Info', display_order: 2, options: [
        { label: 'Pure Vegetarian (No Onion/Garlic)', value: 'Pure Veg' },
        { label: 'Vegetarian & Non-Vegetarian', value: 'Veg & Non-Veg' },
        { label: 'Halal Certified', value: 'Halal' },
        { label: 'Vegan Friendly', value: 'Vegan' },
        { label: 'Jain Food Available', value: 'Jain' }
      ]},
      { key: 'min_guest_guarantee', label: 'Minimum Guests Required', type: 'number', required: true, group: 'Booking Conditions', display_order: 3 },
      { key: 'live_counters_available', label: 'Live Food Counters Included', type: 'checkbox', required: false, group: 'Service Conditions', display_order: 4 }
    ]
  }
];

/**
 * Seed all 12 categories and their initial form schemas into MongoDB
 */
export async function seedMarketplaceCategories(): Promise<void> {
  console.log('[Seed] Seeding universal marketplace categories and form schemas...');

  for (const item of SEED_CATEGORIES) {
    const { category, schemaFields } = item;

    // 1. Upsert Category
    const updatedCategory = await MarketplaceCategory.findOneAndUpdate(
      { code: category.code },
      {
        $set: {
          ...category,
          updated_at: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. Upsert Form Schema for default listing type and wildcard '*'
    await CategoryFormSchema.findOneAndUpdate(
      { category_id: updatedCategory._id, listing_type: '*' },
      {
        $set: {
          category_id: updatedCategory._id,
          listing_type: '*',
          fields: schemaFields,
          is_active: true,
          updated_at: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`[Seed] Successfully seeded ${SEED_CATEGORIES.length} marketplace verticals!`);
}
