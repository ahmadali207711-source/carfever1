'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { createCar, updateCar, uploadImage } from '@/lib/admin-actions';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function EditCarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    body_type: 'Sedan',
    exterior_color: '',
    interior_color: '',
    engine: '',
    horsepower: '',
    description: '',
    status: 'pending',
    city: '',
    currency: 'PKR',
  });

  useEffect(() => {
    if (id) {
      fetchCar();
    }
  }, [id]);

  async function fetchCar() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('cars').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || '',
          make: (data as any).make || '',
          model: data.model || '',
          year: data.year || new Date().getFullYear(),
          price: data.price?.toString() || '',
          mileage: data.mileage?.toString() || '',
          transmission: data.transmission || 'Automatic',
          fuel_type: data.fuel_type || 'Petrol',
          body_type: (data as any).body_type || 'Sedan',
          exterior_color: (data as any).exterior_color || '',
          interior_color: (data as any).interior_color || '',
          engine: (data as any).engine || '',
          horsepower: (data as any).horsepower?.toString() || '',
          description: data.description || '',
          status: data.status || 'pending',
          city: data.city || '',
          currency: data.currency || 'PKR',
        });
        setImages((data.images as string[]) || []);
      }
    } catch (error) {
      toast.error('Failed to fetch car details');
      router.push('/admin/cars');
    } finally {
      setFetching(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        setImages(prev => [...prev, url]);
      }
      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const computedTitle = formData.title || `${formData.year} ${formData.make} ${formData.model}`;
      const slug = computedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-6);

      const dataToSave = {
        title: computedTitle,
        slug,
        make: formData.make,
        model: formData.model,
        year: parseInt(String(formData.year)) || new Date().getFullYear(),
        price: parseFloat(formData.price) || 0,
        currency: formData.currency || 'PKR',
        mileage: parseInt(formData.mileage) || null,
        transmission: formData.transmission,
        fuel_type: formData.fuel_type,
        body_type: formData.body_type,
        exterior_color: formData.exterior_color || null,
        interior_color: formData.interior_color || null,
        engine: formData.engine || null,
        horsepower: formData.horsepower ? parseInt(formData.horsepower) : null,
        description: formData.description || null,
        status: formData.status as 'pending' | 'approved' | 'rejected' | 'draft',
        city: formData.city || null,
        images,
        features: [],
      };

      if (id) {
        await updateCar(id, dataToSave);
        toast.success('Car updated successfully');
      } else {
        await createCar(dataToSave);
        toast.success('Car created successfully');
      }
      router.push('/admin/cars');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save car');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-white text-center py-20">Loading car details...</div>;
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/cars">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {id ? 'Edit Car' : 'Add New Car'}
          </h2>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
          {loading ? 'Saving...' : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Car
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">Listing Title <span className="text-red-500">*</span></Label>
              <Input id="title" name="title" required value={formData.title} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. 2024 Porsche 911 GT3" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price" className="text-zinc-300">Price (USD) <span className="text-red-500">*</span></Label>
              <Input id="price" name="price" type="number" required value={formData.price} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. 185000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="make" className="text-zinc-300">Make <span className="text-red-500">*</span></Label>
              <Input id="make" name="make" required value={formData.make} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. Porsche" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-zinc-300">Model <span className="text-red-500">*</span></Label>
              <Input id="model" name="model" required value={formData.model} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. 911 GT3" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-zinc-300">Year <span className="text-red-500">*</span></Label>
              <Input id="year" name="year" type="number" required value={formData.year} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. 2024" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage" className="text-zinc-300">Mileage <span className="text-red-500">*</span></Label>
              <Input id="mileage" name="mileage" type="number" required value={formData.mileage} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. 1500" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Specifications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-zinc-300">Transmission</Label>
              <Select value={formData.transmission || 'Automatic'} onValueChange={(val) => handleSelectChange('transmission', String(val))}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Semi-Automatic">Semi-Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Fuel Type</Label>
              <Select value={formData.fuel_type || 'Petrol'} onValueChange={(val) => handleSelectChange('fuel_type', String(val))}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Body Type</Label>
              <Select value={formData.body_type || 'Sedan'} onValueChange={(val) => handleSelectChange('body_type', String(val))}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="Coupe">Coupe</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Convertible">Convertible</SelectItem>
                  <SelectItem value="Wagon">Wagon</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="engine" className="text-zinc-300">Engine</Label>
              <Input id="engine" name="engine" value={formData.engine} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. 4.0L Flat-6" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horsepower" className="text-zinc-300">Horsepower</Label>
              <Input id="horsepower" name="horsepower" type="number" value={formData.horsepower} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. 502" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exterior_color" className="text-zinc-300">Exterior Color</Label>
              <Input id="exterior_color" name="exterior_color" value={formData.exterior_color} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. GT Silver Metallic" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Images</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-video rounded-md overflow-hidden bg-zinc-950 border border-zinc-800 group">
                <img src={img} alt={`Car ${idx}`} className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <label className="aspect-video rounded-md border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-zinc-400 hover:text-zinc-300">
              {uploading ? (
                <span className="text-sm">Uploading...</span>
              ) : (
                <>
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm">Upload Image</span>
                </>
              )}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Description</h3>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">Detailed Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              rows={8}
              value={formData.description} 
              onChange={handleChange} 
              className="bg-zinc-950 border-zinc-800 resize-y" 
              placeholder="Write a detailed description of the car..." 
            />
          </div>
        </div>
      </form>
    </div>
  );
}
