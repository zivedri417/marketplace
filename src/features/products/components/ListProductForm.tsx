'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Image as ImageIcon, Star, X, MapPin, DollarSign, Tag, FileText, Gavel, Calendar } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { createProduct } from '@/features/products/actions'
import { inputClass, pillButtonPrimary, monoLabelClass } from '@/lib/ui'

interface Category {
  id: string
  name: string
}

const MAX_ADDITIONAL_IMAGES = 9

// Only the regular web image formats are supported — anything else (e.g. HEIC/HEIF photos
// straight from an iPhone) can't be previewed or compressed, so it's rejected up front.
const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
}
const UNSUPPORTED_FORMAT_MESSAGE = 'Unsupported image format. Please upload a JPEG, PNG, WebP, or BMP image.'

export function ListProductForm({ categories }: { categories: Category[] }) {
  const [primaryImage, setPrimaryImage] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [isAuction, setIsAuction] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const { getRootProps: getPrimaryRootProps, getInputProps: getPrimaryInputProps, isDragActive: isPrimaryDragActive } = useDropzone({
    accept: ACCEPTED_IMAGE_TYPES,
    maxFiles: 1,
    multiple: false,
    onDropAccepted: (files) => {
      setError(null)
      setPrimaryImage(files[0])
    },
    onDropRejected: () => setError(UNSUPPORTED_FORMAT_MESSAGE),
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    setImages(prev => {
      const newImages = [...prev, ...acceptedFiles]
      if (newImages.length > MAX_ADDITIONAL_IMAGES) return newImages.slice(0, MAX_ADDITIONAL_IMAGES)
      return newImages
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxFiles: MAX_ADDITIONAL_IMAGES,
    onDropRejected: () => setError(UNSUPPORTED_FORMAT_MESSAGE),
  })

  const removePrimaryImage = () => setPrimaryImage(null)

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadImage(file: File, userId: string): Promise<string> {
    // Compress
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })

    // Upload
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, compressedFile)

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!primaryImage) {
      setError('Please upload a primary image.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('is_auction', isAuction.toString())

    const rawDeadline = formData.get('auction_deadline') as string | null
    if (rawDeadline) {
      // datetime-local has no offset, so the browser's Date constructor parses it
      // as local time — convert that to a real UTC instant before it hits the DB.
      formData.set('auction_deadline', new Date(rawDeadline).toISOString())
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // 1. Compress and upload the primary image first, so it always lands at
      //    index 0 — the grid layout and item page both use images[0] as the cover.
      const primaryUrl = await uploadImage(primaryImage, user.id)
      const additionalUrls: string[] = []
      for (const file of images) {
        additionalUrls.push(await uploadImage(file, user.id))
      }
      const uploadedUrls = [primaryUrl, ...additionalUrls]

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
      className="max-w-3xl mx-auto p-8 sm:p-10 rounded-[28px] bg-[#08080d] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-white space-y-8"
      onSubmit={handleSubmit}
    >
      <div className="mb-8">
        <h2 className="text-[30px] font-bold tracking-tight text-white">
          List an Item
        </h2>
        <p className="text-white/55 text-sm mt-2">Good photos and an honest description sell twice as fast.</p>
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

      {/* Primary Image Section */}
      <div className="space-y-4">
        <div className={monoLabelClass}>01 · Primary Image (required)</div>
        <p className="text-xs text-white/45">This photo represents your item in the browse grid and is shown first on the item page.</p>

        {primaryImage ? (
          <div className="relative group w-40 h-40 rounded-2xl overflow-hidden border-2 border-purple-500/50">
            <img
              src={URL.createObjectURL(primaryImage)}
              alt="primary preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-white" /> Primary
            </div>
            <button
              type="button"
              onClick={removePrimaryImage}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        ) : (
          <div
            {...getPrimaryRootProps()}
            className={`border-[1.5px] border-dashed rounded-[22px] p-8 h-[230px] flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors ${
              isPrimaryDragActive ? 'border-purple-300/70 bg-indigo-500/[0.12]' : 'border-indigo-300/35 bg-indigo-500/[0.07] hover:border-purple-300/70 hover:bg-indigo-500/[0.12]'
            }`}
          >
            <input {...getPrimaryInputProps()} />
            <Star className="mx-auto h-10 w-10 text-white/40 mb-1" />
            <p className="text-[15px] font-semibold text-white">Drag &amp; drop your primary image here, or click to select</p>
            <p className="text-xs text-white/45">JPEG, PNG, WebP, or BMP only.</p>
          </div>
        )}
      </div>

      {/* Images Section */}
      <div className="space-y-4">
        <div className={monoLabelClass}>02 · Additional Images (up to {MAX_ADDITIONAL_IMAGES})</div>
        <div
          {...getRootProps()}
          className={`border-[1.5px] border-dashed rounded-[22px] p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-purple-300/70 bg-indigo-500/[0.12]' : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
        >
          <input {...getInputProps()} />
          <ImageIcon className="mx-auto h-12 w-12 text-white/40 mb-4" />
          <p className="text-sm text-white/70">Drag &amp; drop some images here, or click to select</p>
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
      <div className="space-y-4">
        <div className={monoLabelClass}>03 · Item Details</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[12.5px] text-white/60 ml-1">Title</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-white/35" />
              </div>
              <input name="title" required className={`${inputClass} pl-10 pr-3 py-3 text-sm`} placeholder="e.g. Mid-century teak lounge chair" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12.5px] text-white/60 ml-1">Category</label>
            <select name="category_id" required className={`${inputClass} px-3.5 py-3 text-sm appearance-none [&>option]:text-black`}>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[12.5px] text-white/60 ml-1">Location</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-white/35" />
              </div>
              <input name="location" required className={`${inputClass} pl-10 pr-3 py-3 text-sm`} placeholder="City, country" />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[12.5px] text-white/60 ml-1">Description</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-white/35" />
              </div>
              <textarea name="description" rows={4} className={`${inputClass} pl-10 pr-3 py-3 text-sm resize-y`} placeholder="Condition, history, flaws, dimensions…" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Auction Section */}
      <div className="border-t border-white/10 pt-8 space-y-6">
        <div className={monoLabelClass}>04 · Sale Format</div>
        <div className="p-5 rounded-[22px] border border-white/10 bg-white/[0.04] space-y-4">
        <div className="flex items-center justify-between gap-5">
          <div>
            <h3 className="text-[16px] font-semibold text-white">{isAuction ? 'Auction' : 'Fixed price'}</h3>
            <p className="text-[13px] text-white/55 mt-1">
              {isAuction ? 'Buyers place offers; highest offer above your minimum wins at the deadline.' : 'One price, first buyer to message you takes it.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAuction(!isAuction)}
            className="flex-none w-[150px] p-[5px] border border-white/10 rounded-full bg-black/40 flex gap-1 cursor-pointer"
          >
            <span className={`flex-1 py-2 rounded-full text-xs font-semibold text-center transition-colors ${!isAuction ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600' : 'text-white/60'}`}>
              Fixed
            </span>
            <span className={`flex-1 py-2 rounded-full text-xs font-semibold text-center transition-colors ${isAuction ? 'text-white bg-gradient-to-r from-violet-700 to-purple-600' : 'text-white/60'}`}>
              Auction
            </span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isAuction ? (
            <motion.div key="fixed" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 max-w-[280px]">
              <label className="text-[12.5px] text-white/60 ml-1">Price (USD)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-white/35" />
                </div>
                <input name="price" type="number" step="0.01" min="0.01" required className={`${inputClass} pl-10 pr-3 py-3 text-sm`} placeholder="0.00" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="auction" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12.5px] text-white/60 ml-1">Starting Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Gavel className="h-5 w-5 text-white/35" />
                  </div>
                  <input name="price" type="number" step="0.01" min="0.01" required className={`${inputClass} pl-10 pr-3 py-3 text-sm`} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12.5px] text-white/60 ml-1">Minimum Accepted Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-white/35" />
                  </div>
                  <input name="minimum_price" type="number" step="0.01" min="0.01" required className={`${inputClass} pl-10 pr-3 py-3 text-sm`} placeholder="Optional minimum" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[12.5px] text-white/60 ml-1">Auction Deadline</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-white/35" />
                  </div>
                  <input name="auction_deadline" type="datetime-local" required className={`${inputClass} pl-10 pr-3 py-3 text-sm [&::-webkit-calendar-picker-indicator]:invert`} />
                </div>
                <p className="text-xs text-white/45">We close the auction automatically at the deadline and award it to the highest offer above your minimum.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 py-4 text-[16px] ${pillButtonPrimary}`}
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publish Listing'}
        </motion.button>
      </div>
    </motion.form>
  )
}
