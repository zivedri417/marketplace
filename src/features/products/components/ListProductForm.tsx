'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Image as ImageIcon, X, MapPin, DollarSign, Tag, FileText, Gavel, Calendar } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { createProduct } from '@/features/products/actions'

interface Category {
  id: string
  name: string
}

export function ListProductForm({ categories }: { categories: Category[] }) {
  const [images, setImages] = useState<File[]>([])
  const [isAuction, setIsAuction] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prev => {
      const newImages = [...prev, ...acceptedFiles]
      if (newImages.length > 10) return newImages.slice(0, 10)
      return newImages
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 10,
  })

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (images.length === 0) {
      setError('Please upload at least 1 image.')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('is_auction', isAuction.toString())

    try {
      // 1. Compress and Upload Images
      const uploadedUrls: string[] = []
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      for (const file of images) {
        // Compress
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
        
        // Upload
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(fileName, compressedFile)
          
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
          
        uploadedUrls.push(publicUrl)
      }

      // 2. Submit Product
      const res = await createProduct(formData, uploadedUrls)
      
      if (res?.error) {
        setError(res.error)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-white space-y-8"
      onSubmit={handleSubmit}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          List an Item
        </h2>
        <p className="text-gray-400 text-sm mt-2">Fill in the details to list your item for sale or auction.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Images Section */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-300">Images (Max 10)</label>
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
        >
          <input {...getInputProps()} />
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-300">Drag & drop some images here, or click to select</p>
          <p className="text-xs text-gray-500 mt-2">At least 1 photo required.</p>
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4">
            {images.map((file, idx) => (
              <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-white/20">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Title</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-5 w-5 text-gray-500" />
            </div>
            <input name="title" required className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="E.g., Vintage Leather Jacket" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Category</label>
          <select name="category_id" required className="block w-full px-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none [&>option]:text-black">
            <option value="">Select a category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Location</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-500" />
            </div>
            <input name="location" required className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="City, Country" />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Description</label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <textarea name="description" rows={4} className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none" placeholder="Describe your item in detail..." />
          </div>
        </div>
      </div>

      {/* Pricing & Auction Section */}
      <div className="border-t border-white/10 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Selling Format</h3>
            <p className="text-sm text-gray-400">Choose fixed price or set up an auction.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAuction(!isAuction)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAuction ? 'bg-purple-500' : 'bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAuction ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isAuction ? (
            <motion.div key="fixed" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Price (USD)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                </div>
                <input name="price" type="number" step="0.01" min="0.01" required className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="0.00" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="auction" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Starting Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Gavel className="h-5 w-5 text-gray-500" />
                  </div>
                  <input name="price" type="number" step="0.01" min="0.01" required className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Minimum Accepted Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                  </div>
                  <input name="minimum_price" type="number" step="0.01" min="0.01" required className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Optional minimum" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Auction Deadline</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <input name="auction_deadline" type="datetime-local" required className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publish Listing'}
      </motion.button>
    </motion.form>
  )
}
