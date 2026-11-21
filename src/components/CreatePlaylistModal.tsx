import React, { useState } from 'react';
import { storeActions } from '../store';
import { Icon } from '../ui/icons';

export interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (playlistId: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedCover, setSelectedCover] = useState('living');

  if (!isOpen) return null;

  const covers = ['living', 'hchair', 'detail', 'throw', 'lounge', 'sofa', 'chair', 'linen', 'sunset', 'cabin'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = storeActions.createPlaylist(name.trim(), desc.trim(), selectedCover);
    setName('');
    setDesc('');
    onCreated(pl.id);
    onClose();
  };

  return (
    <div className="finder-backdrop" onClick={onClose}>
      <div
        className="card modal create-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Create new playlist"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-modal__head">
          <h2 className="title">New Playlist</h2>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-modal__form">
          <label className="field">
            <span className="field__label">Playlist Name</span>
            <input
              type="text"
              className="input"
              placeholder="e.g. Rainy Afternoon Lo-Fi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Description (optional)</span>
            <textarea
              className="textarea"
              placeholder="A few words about this playlist..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
            />
          </label>

          <div className="field">
            <span className="field__label">Cover Art</span>
            <div className="create-modal__covers">
              {covers.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`create-modal__cover-btn${selectedCover === c ? ' is-selected' : ''}`}
                  onClick={() => setSelectedCover(c)}
                >
                  <img
                    src={`/photos/306-lullo/${c}.jpg`}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="create-modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!name.trim()}
            >
              Create Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
