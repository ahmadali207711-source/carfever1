"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Car,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Info,
  X,
  AlertTriangle,
  Check
} from "lucide-react";
import { submitCarListing } from '@/lib/server-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SellCarPage() {
  const [step, setStep] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    mileage: "",
    fuelType: "petrol",
    transmission: "automatic",
    engineCapacity: "",
    city: "",
    price: "",
    sellerName: "",
    sellerPhone: "",
    description: "",
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = filesArray.map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      const imageFiles = filesArray.filter(file => file.type.startsWith("image/"));
      const newImages = imageFiles.map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
      setUploadedFiles(prev => [...prev, ...imageFiles]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmitListing = async () => {
    try {
      const result = await submitCarListing({
        make: formData.make,
        model: formData.model,
        year: formData.year,
        mileage: formData.mileage,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        engineCapacity: formData.engineCapacity,
        city: formData.city,
        price: formData.price,
        sellerName: formData.sellerName,
        sellerPhone: formData.sellerPhone,
        description: formData.description,
        images: uploadedFiles,
      });

      if (result.success) {
        showToast("Submitted successfully! Pending admin approval.", "success");
        nextStep();
      } else {
        showToast(result.error || "Failed to submit listing", "error");
      }
    } catch (error) {
      showToast("An error occurred. Please try again.", "error");
    }
  };

  const isStep1Valid = formData.make && formData.model && formData.year && formData.mileage && formData.engineCapacity;
  const isStep2Valid = formData.city && formData.price && formData.sellerName && formData.sellerPhone;

  // Input shared classes
  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] focus:border-[#0055FE] transition-all";
  const selectClass = "w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#0055FE] focus:border-[#0055FE] transition-all cursor-pointer";
  const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 lg:pt-24 pb-20 bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-10 mt-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Sell Your Car <span className="text-[#0055FE]">Instantly</span>
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
              Follow these simple steps to post your listing on Pakistan's premium car marketplace.
            </p>
          </div>

          {/* Progress Bar */}
          {step <= 3 && (
            <div className="mb-12 bg-white border border-gray-200 rounded-2xl p-4 sm:px-8 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= 1 ? "bg-[#0055FE] text-white" : "bg-gray-100 text-gray-400"
                }`}>1</div>
                <span className={`text-xs sm:text-sm font-semibold hidden xs:inline ${
                  step === 1 ? "text-gray-900" : "text-gray-400"
                }`}>Details</span>
              </div>
              <div className="h-px bg-gray-200 flex-1 mx-4" />
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= 2 ? "bg-[#0055FE] text-white" : "bg-gray-100 text-gray-400"
                }`}>2</div>
                <span className={`text-xs sm:text-sm font-semibold hidden xs:inline ${
                  step === 2 ? "text-gray-900" : "text-gray-400"
                }`}>Pricing</span>
              </div>
              <div className="h-px bg-gray-200 flex-1 mx-4" />
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= 3 ? "bg-[#0055FE] text-white" : "bg-gray-100 text-gray-400"
                }`}>3</div>
                <span className={`text-xs sm:text-sm font-semibold hidden xs:inline ${
                  step === 3 ? "text-gray-900" : "text-gray-400"
                }`}>Photos</span>
              </div>
            </div>
          )}

          {/* Form Content Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-sm">

            {/* STEP 1: Vehicle Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#0055FE]" /> Vehicle Details
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Make / Brand</label>
                    <select name="make" value={formData.make} onChange={handleInputChange} className={selectClass}>
                      <option value="" disabled>Select Make</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Honda">Honda</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="KIA">KIA</option>
                      <option value="Hyundai">Hyundai</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Model</label>
                    <input type="text" name="model" placeholder="e.g. Corolla GLi, Civic Turbo" value={formData.model} onChange={handleInputChange} className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Registration Year</label>
                    <select name="year" value={formData.year} onChange={handleInputChange} className={selectClass}>
                      <option value="" disabled>Select Year</option>
                      {Array.from({ length: 15 }).map((_, i) => {
                        const yr = 2025 - i;
                        return <option key={yr} value={yr}>{yr}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Mileage (km)</label>
                    <input type="number" name="mileage" placeholder="e.g. 25000" value={formData.mileage} onChange={handleInputChange} className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Fuel Type</label>
                    <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className={selectClass}>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Transmission</label>
                    <select name="transmission" value={formData.transmission} onChange={handleInputChange} className={selectClass}>
                      <option value="automatic">Automatic</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Engine Capacity (cc)</label>
                    <input type="number" name="engineCapacity" placeholder="e.g. 1300 or 1500" value={formData.engineCapacity} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <Button 
                    disabled={!isStep1Valid}
                    onClick={nextStep}
                    className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 transition-colors w-full sm:w-auto"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Pricing & Location */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#0055FE]" /> Pricing & Location
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>City</label>
                    <select name="city" value={formData.city} onChange={handleInputChange} className={selectClass}>
                      <option value="" disabled>Select City</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Faisalabad">Faisalabad</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Asking Price (PKR Lacs)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                        PKR
                      </div>
                      <input type="number" name="price" placeholder="e.g. 45.5" value={formData.price} onChange={handleInputChange} className={`${inputClass} pl-14`} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Seller's Name</label>
                    <input type="text" name="sellerName" placeholder="e.g. Ali Ahmed" value={formData.sellerName} onChange={handleInputChange} className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Seller's Phone</label>
                    <input type="tel" name="sellerPhone" placeholder="e.g. 03001234567" value={formData.sellerPhone} onChange={handleInputChange} className={inputClass} />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className={labelClass}>Description</label>
                    <textarea 
                      name="description" 
                      rows={4}
                      placeholder="Describe your car's condition, features, history, etc..." 
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-gray-100">
                  <Button 
                    variant="outline"
                    onClick={prevStep}
                    className="border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 w-full sm:w-auto h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    disabled={!isStep2Valid}
                    onClick={nextStep}
                    className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 transition-colors w-full sm:w-auto"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Photos Upload */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#0055FE]" /> Upload Photos
                </h2>

                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-gray-200 hover:border-[#0055FE]/40 rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-gray-50 cursor-pointer group"
                >
                  <UploadCloud className="w-12 h-12 text-gray-300 group-hover:text-[#0055FE] transition-colors mb-4" />
                  <p className="text-sm text-gray-700 font-semibold mb-1">Drag and drop images here</p>
                  <p className="text-xs text-gray-400 mb-5">Supported formats: JPG, PNG (Max 5MB per file)</p>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                  />

                  <Button 
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-semibold"
                  >
                    Upload from Device
                  </Button>
                </div>

                {uploadedImages.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Uploaded Images</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-200 group">
                          <img src={img} className="w-full h-full object-cover" alt="Upload preview" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedImages(prev => prev.filter((_, idx) => idx !== i));
                              setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-red-50 border border-gray-200 rounded-full text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-gray-600 text-xs sm:text-sm">
                  <Info className="w-5 h-5 text-[#0055FE] shrink-0" />
                  <span>High quality photos taken in broad daylight improve your chances of getting competitive offers by up to 80%.</span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-gray-100">
                  <Button 
                    variant="outline"
                    onClick={prevStep}
                    className="border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 w-full sm:w-auto h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    disabled={uploadedImages.length === 0}
                    onClick={handleSubmitListing}
                    className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 px-8 transition-colors w-full sm:w-auto"
                  >
                    Submit Listing <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Success Screen */}
            {step === 4 && (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-[#00B67A]/10 border border-[#00B67A]/30 text-[#00B67A] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Car Listing Submitted!</h2>
                
                <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                  Congratulations <span className="text-gray-900 font-bold">{formData.sellerName}</span>, your {formData.year} {formData.make} {formData.model} has been submitted to our listing review board.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-md mx-auto text-left space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">What happens next?</h3>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#0055FE]/10 border border-[#0055FE]/20 flex items-center justify-center text-xs text-[#0055FE] font-bold shrink-0">1</span>
                    <span>Our team will contact you at <strong className="text-gray-900">{formData.sellerPhone}</strong> to schedule a physical verification inspection.</span>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#0055FE]/10 border border-[#0055FE]/20 flex items-center justify-center text-xs text-[#0055FE] font-bold shrink-0">2</span>
                    <span>Upon successful inspection, your car will receive a <strong>Car Fever Certified</strong> badge.</span>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#0055FE]/10 border border-[#0055FE]/20 flex items-center justify-center text-xs text-[#0055FE] font-bold shrink-0">3</span>
                    <span>Your listing will go live, and you will begin receiving buy requests instantly.</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Link href="/buy-car">
                    <Button className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold px-8 h-12">
                      Go to Marketplace
                    </Button>
                  </Link>
                </div>
              </div>
            )}

          </div>

          {/* Toast */}
          {toastMessage && (
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-4 ${
              toastType === "success"
                ? "bg-[#00B67A]/10 border-[#00B67A]/30 text-[#00B67A]"
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {toastType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {toastMessage}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
