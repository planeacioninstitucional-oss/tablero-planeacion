import React, { useState } from 'react';
import img1 from '../assets/bici.jpeg';
import img2 from '../assets/plan1.jpeg';
import img3 from '../assets/planinfi.jpeg';
import img4 from '../assets/re1.jpeg';
import img5 from '../assets/re2.jpeg';
import img6 from '../assets/rein.jpeg';
import img7 from '../assets/rein2.jpeg';
import img8 from '../assets/segundo.jpeg';

const images = [img1, img2, img3, img4, img5, img6, img7, img8];

export default function Galeria() {
    const [selectedImage, setSelectedImage] = useState(null);

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">Galería de Imágenes</h1>
                <p className="page-subtitle">Explora todas las imágenes utilizadas en el fondo de la plataforma.</p>
            </div>

            <div className="card">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {images.map((img, idx) => (
                        <div key={idx} style={{
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'transform 0.3s ease',
                            cursor: 'pointer'
                        }}
                            onClick={() => setSelectedImage(img)}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <img src={img} alt={`Imagen ${idx + 1}`} style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                display: 'block'
                            }} />
                        </div>
                    ))}
                </div>
            </div>

            {selectedImage && (
                <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="icon-btn"
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                zIndex: 10
                            }}
                            onClick={() => setSelectedImage(null)}
                            title="Cerrar"
                        >
                            <span className="material-icons">close</span>
                        </button>

                        <img
                            src={selectedImage}
                            alt="Vista ampliada"
                            style={{
                                maxWidth: '100%',
                                maxHeight: 'calc(90vh - 80px)',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                            }}
                        />

                        <a
                            href={selectedImage}
                            download="imagen-galeria.jpeg"
                            className="btn btn-primary"
                            style={{ textDecoration: 'none' }}
                        >
                            <span className="material-icons">file_download</span>
                            Descargar foto
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
