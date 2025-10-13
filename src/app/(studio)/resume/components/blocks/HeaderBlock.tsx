'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, ExternalLink, Plus, X } from 'lucide-react';
import type { HeaderBlockData } from '@/lib/validators/resume';

interface HeaderBlockProps {
  data: HeaderBlockData;
  isSelected?: boolean;
  readOnly?: boolean;
  onDataChange?: (data: HeaderBlockData) => void;
  onClick?: () => void;
}

export function HeaderBlock({
  data,
  isSelected,
  readOnly,
  onDataChange,
  onClick,
}: HeaderBlockProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', url: '' });

  const handleChange = (field: string, value: any) => {
    if (readOnly) return;

    const newData = { ...data };

    if (field.startsWith('contact.')) {
      const contactField = field.split('.')[1];
      newData.contact = {
        ...newData.contact,
        [contactField]: value,
      };
    } else {
      (newData as any)[field] = value;
    }

    onDataChange?.(newData);
  };

  const addLink = () => {
    if (!newLink.label || !newLink.url) return;

    const links = data.contact.links || [];
    handleChange('contact.links', [...links, newLink]);
    setNewLink({ label: '', url: '' });
    setIsAddingLink(false);
  };

  const removeLink = (index: number) => {
    const links = data.contact.links || [];
    handleChange(
      'contact.links',
      links.filter((_, i) => i !== index)
    );
  };

  return (
    <div
      className={`p-4 rounded-lg transition-all ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {/* Full Name */}
      {readOnly ? (
        <h1 className="text-3xl font-bold text-gray-900">{data.fullName}</h1>
      ) : (
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
          placeholder="Your Full Name"
        />
      )}

      {/* Title */}
      {data.title && (
        <div className="mt-2">
          {readOnly ? (
            <p className="text-lg text-gray-600">{data.title}</p>
          ) : (
            <input
              type="text"
              value={data.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="text-lg text-gray-600 w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
              placeholder="Professional Title (optional)"
            />
          )}
        </div>
      )}

      {/* Contact Information */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        {/* Email */}
        {(data.contact.email || !readOnly) && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 flex-shrink-0" />
            {readOnly ? (
              <span>{data.contact.email}</span>
            ) : (
              <input
                type="email"
                value={data.contact.email || ''}
                onChange={(e) => handleChange('contact.email', e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
                placeholder="email@example.com"
              />
            )}
          </div>
        )}

        {/* Phone */}
        {(data.contact.phone || !readOnly) && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 flex-shrink-0" />
            {readOnly ? (
              <span>{data.contact.phone}</span>
            ) : (
              <input
                type="tel"
                value={data.contact.phone || ''}
                onChange={(e) => handleChange('contact.phone', e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
                placeholder="(555) 123-4567"
              />
            )}
          </div>
        )}

        {/* Location */}
        {(data.contact.location || !readOnly) && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            {readOnly ? (
              <span>{data.contact.location}</span>
            ) : (
              <input
                type="text"
                value={data.contact.location || ''}
                onChange={(e) => handleChange('contact.location', e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2"
                placeholder="City, State"
              />
            )}
          </div>
        )}
      </div>

      {/* Professional Links */}
      {(data.contact.links && data.contact.links.length > 0) || !readOnly ? (
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {data.contact.links?.map((link, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {readOnly ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link.label}
                </a>
              ) : (
                <>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const links = [...(data.contact.links || [])];
                      links[index] = { ...links[index], label: e.target.value };
                      handleChange('contact.links', links);
                    }}
                    className="bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 w-24"
                    placeholder="Label"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const links = [...(data.contact.links || [])];
                      links[index] = { ...links[index], url: e.target.value };
                      handleChange('contact.links', links);
                    }}
                    className="bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-300 rounded px-2 flex-1"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => removeLink(index)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Add Link Button */}
          {!readOnly && (
            <>
              {isAddingLink ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newLink.label}
                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                    className="border rounded px-2 py-1 text-sm w-24"
                    placeholder="Label"
                  />
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="border rounded px-2 py-1 text-sm flex-1"
                    placeholder="https://..."
                  />
                  <button
                    onClick={addLink}
                    className="text-green-600 hover:text-green-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingLink(false);
                      setNewLink({ label: '', url: '' });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingLink(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
