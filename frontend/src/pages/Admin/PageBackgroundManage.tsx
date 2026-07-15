import { ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import {
  PAGE_BACKGROUND_KEYS,
  PAGE_BACKGROUND_LABEL_KEYS,
  PageBackgroundKey,
} from '../../types/pageBackgrounds';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

function backgroundImageStyle(imageUrl: string | undefined) {
  if (!imageUrl) return undefined;
  return { backgroundImage: `url("${imageUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")` };
}

export default function PageBackgroundManage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  const { data, isLoading, isError } = useQuery(['adminPageBackgrounds'], () =>
    api.getAdminPageBackgrounds()
  );

  const uploadMutation = useMutation(
    ({ pageKey, file }: { pageKey: PageBackgroundKey; file: File }) =>
      api.uploadPageBackground(pageKey, file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPageBackgrounds']);
        queryClient.invalidateQueries(['pageBackgrounds']);
        showToast({
          type: 'success',
          title: t('admin.pageBackgrounds.uploadSuccess'),
        });
      },
      onError: (error: Error) => {
        showToast({
          type: 'error',
          title: t('admin.pageBackgrounds.uploadError'),
          message: error.message,
        });
      },
    }
  );

  const resetMutation = useMutation((pageKey: PageBackgroundKey) => api.resetPageBackground(pageKey), {
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPageBackgrounds']);
      queryClient.invalidateQueries(['pageBackgrounds']);
      showToast({
        type: 'success',
        title: t('admin.pageBackgrounds.resetSuccess'),
      });
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: t('admin.pageBackgrounds.resetError'),
        message: error.message,
      });
    },
  });

  const handleFileChange = (pageKey: PageBackgroundKey, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    uploadMutation.mutate({ pageKey, file });
  };

  if (isLoading) {
    return <p className="admin-field-note">{t('common.loading')}</p>;
  }

  if (isError || !data) {
    return <p className="admin-error">{t('admin.pageBackgrounds.loadError')}</p>;
  }

  return (
    <div className="page-background-manager">
      <p className="admin-field-note">{t('admin.pageBackgrounds.hint')}</p>
      <div className="page-background-grid">
        {PAGE_BACKGROUND_KEYS.map((pageKey) => {
          const entry = data.backgrounds[pageKey];
          const imageUrl = resolveMediaUrl(entry.imageUrl);
          const isUploading =
            uploadMutation.isLoading && uploadMutation.variables?.pageKey === pageKey;
          const isResetting = resetMutation.isLoading && resetMutation.variables === pageKey;

          return (
            <article className="page-background-card" key={pageKey}>
              <div
                className="page-background-preview"
                style={backgroundImageStyle(imageUrl)}
                aria-label={t(PAGE_BACKGROUND_LABEL_KEYS[pageKey])}
              />
              <div className="page-background-card-body">
                <div className="page-background-card-header">
                  <div>
                    <h3>{t(PAGE_BACKGROUND_LABEL_KEYS[pageKey])}</h3>
                    <p className="admin-field-note">
                      {entry.isCustom
                        ? t('admin.pageBackgrounds.customHint')
                        : t('admin.pageBackgrounds.defaultHint')}
                    </p>
                  </div>
                  <span className={`page-background-status ${entry.isCustom ? 'custom' : 'default'}`}>
                    {entry.isCustom
                      ? t('admin.pageBackgrounds.custom')
                      : t('admin.pageBackgrounds.default')}
                  </span>
                </div>
                <div className="page-background-actions">
                  <label className="admin-upload-field page-background-upload">
                    <span className="admin-upload-control">
                      <span className="admin-upload-button">
                        {isUploading
                          ? t('admin.pageBackgrounds.uploading')
                          : t('admin.pageBackgrounds.upload')}
                      </span>
                      <span className="admin-upload-filename">
                        {t('admin.pageBackgrounds.fileTypes')}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={isUploading || isResetting}
                        onChange={(event) => handleFileChange(pageKey, event)}
                      />
                    </span>
                    <span className="page-background-filetypes">
                      {t('admin.pageBackgrounds.fileTypes')}
                    </span>
                  </label>
                  <button
                    className="admin-action-button secondary"
                    type="button"
                    disabled={!entry.isCustom || isUploading || isResetting}
                    onClick={() => resetMutation.mutate(pageKey)}
                  >
                    {isResetting
                      ? t('admin.pageBackgrounds.resetting')
                      : t('admin.pageBackgrounds.reset')}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
