import React, { useState, useRef } from 'react';
import { useApp } from '../context';
import img1 from '../assets/bici.jpeg';
import img2 from '../assets/plan1.jpeg';
import img3 from '../assets/planinfi.jpeg';
import img4 from '../assets/re1.jpeg';
import img5 from '../assets/re2.jpeg';
import img6 from '../assets/rein.jpeg';
import img7 from '../assets/rein2.jpeg';
import img8 from '../assets/segundo.jpeg';

const localImages = [
    { url: img1, name: 'bici.jpeg', local: true },
    { url: img2, name: 'plan1.jpeg', local: true },
    { url: img3, name: 'planinfi.jpeg', local: true },
    { url: img4, name: 're1.jpeg', local: true },
    { url: img5, name: 're2.jpeg', local: true },
    { url: img6, name: 'rein.jpeg', local: true },
    { url: img7, name: 'rein2.jpeg', local: true },
    { url: img8, name: 'segundo.jpeg', local: true },
];

export default function Galeria() {
    const { user, galleryImages, uploadGalleryImage, deleteGalleryImage } = useApp();
    const isJefe = user?.rol === 'jefe';
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const fileInputRef = useRef(null);

    // Combine local + Supabase Storage images
    const allImages = [...localImages, ...galleryImages];

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('El archivo no puede superar 10 MB.');
            return;
        }

        setUploading(true);
        setUploadError('');
        try {
            await uploadGalleryImage(file);
        } catch (err) {
            setUploadError('Error al subir: ' + (err.message || 'intenta de nuevo.'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (img) => {
        try {
            await deleteGalleryImage(img.name);
            if (selectedImage?.url === img.url) setSelectedImage(null);
        } catch (err) {
            alert('Error al eliminar: ' + (err.message || 'intenta de nuevo.'));
        }
        setDeleteConfirm(null);
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Galería de Imágenes</h1>
                    <p className="page-subtitle">
                        Imágenes del carrusel de fondo · {allImages.length} foto{allImages.length !== 1 ? 's' : ''}
                        {galleryImages.length > 0 && <span style={{ color: 'var(--accent-cyan)', marginLeft: 8 }}>· {galleryImages.length} subida{galleryImages.length !== 1 ? 's' : ''} en la nube</span>}
                    </p>
                </div>
                {isJefe && (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleUpload}
                            id="gallery-upload-input"
                        />
                        <label htmlFor="gallery-upload-input">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                style={{ cursor: 'pointer' }}
                            >
                                {uploading
                                    ? <><span className="material-icons" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>refresh</span> Subiendo...</>
                                    : <><span className="material-icons">cloud_upload</span> Subir Imagen</>
                                }
                            </button>
                        </label>
                        {uploadError && (
                            <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--accent-orange)', maxWidth: 260, textAlign: 'right' }}>
                                ⚠️ {uploadError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* UPLOAD ZONE (drag feel) */}
            {isJefe && (
                <div
                    style={{
                        marginBottom: 24, padding: '16px 24px',
                        border: '2px dashed rgba(108,99,255,0.35)',
                        borderRadius: 'var(--radius)', background: 'rgba(108,99,255,0.05)',
                        display: 'flex', alignItems: 'center', gap: 14,
                        cursor: 'pointer', transition: 'border-color 0.2s'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                            const syntheticEvent = { target: { files: [file] } };
                            handleUpload(syntheticEvent);
                        }
                    }}
                >
                    <span className="material-icons" style={{ fontSize: 32, color: 'rgba(108,99,255,0.6)' }}>add_photo_alternate</span>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Haz clic o arrastra una imagen aquí para subirla</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG, WEBP o GIF · Máx 10 MB · Se habilitará en el carrusel de fondo automáticamente</div>
                    </div>
                </div>
            )}

            {/* SECTIONS */}
            {galleryImages.length > 0 && (
                <>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        ☁️ Imágenes en la nube ({galleryImages.length})
                    </div>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                            {galleryImages.map((img) => (
                                <div
                                    key={img.name}
                                    style={{
                                        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                        border: '2px solid rgba(108,99,255,0.3)',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s',
                                        cursor: 'pointer', position: 'relative'
                                    }}
                                    onClick={() => setSelectedImage(img)}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,99,255,0.3)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
                                >
                                    <img src={img.url} alt={img.name} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                                        <span style={{ background: 'rgba(108,99,255,0.85)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>☁️ Nube</span>
                                        {isJefe && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(img); }}
                                                style={{ background: 'rgba(255,60,60,0.85)', border: 'none', borderRadius: 8, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                                                title="Eliminar imagen"
                                            >
                                                <span className="material-icons" style={{ fontSize: 14 }}>delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                🖼️ Imágenes base ({localImages.length})
            </div>
            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                    {localImages.map((img, idx) => (
                        <div
                            key={idx}
                            style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.3s ease', cursor: 'pointer' }}
                            onClick={() => setSelectedImage(img)}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <img src={img.url} alt={`Imagen ${idx + 1}`} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* LIGHTBOX */}
            {selectedImage && (
                <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', zIndex: 10 }} onClick={() => setSelectedImage(null)} title="Cerrar">
                            <span className="material-icons">close</span>
                        </button>
                        <img src={selectedImage.url} alt="Vista ampliada" style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 80px)', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
                        {!selectedImage.local && (
                            <a href={selectedImage.url} download={selectedImage.name} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                <span className="material-icons">file_download</span> Descargar foto
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">🗑️ Eliminar imagen</div>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}><span className="material-icons">close</span></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '12px 0' }}>
                            ¿Seguro que deseas eliminar <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong> de la nube? Esta acción no se puede deshacer.
                        </p>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                            <button className="btn btn-primary" style={{ background: 'rgba(255,60,60,0.8)' }} onClick={() => handleDelete(deleteConfirm)}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
