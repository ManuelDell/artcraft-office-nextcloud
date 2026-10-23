<?php

declare(strict_types=1);

namespace OCA\WordCraft\DirectEditing;

use OCP\AppFramework\Http\NotFoundResponse;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\DirectEditing\IEditor;
use OCP\DirectEditing\IToken;
use OCP\IL10N;
use OCP\IUserManager;
use OCP\Util;

/**
 * Registers ArtCraft (WordCraft/GridCraft/DeckCraft/PdfCraft) as a Nextcloud editor, so the
 * mobile/desktop clients and "Open with" offer it. open() renders a full-page host that embeds
 * the matching WASM editor for the file.
 */
class ArtCraftEditor implements IEditor {
    public const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    public const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    public const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    public const PDF = 'application/pdf';

    public function __construct(private IL10N $l10n, private IUserManager $userManager) {
    }

    public function getId(): string {
        return 'wordcraft';
    }

    public function getName(): string {
        return $this->l10n->t('ArtCraft Office');
    }

    public function getMimetypes(): array {
        return [self::DOCX, self::XLSX, self::PPTX];
    }

    public function getMimetypesOptional(): array {
        return [self::PDF];
    }

    public function getCreators(): array {
        return [
            new ArtCraftCreator('wc_docx', $this->l10n->t('Word document (WordCraft)'), 'docx', self::DOCX),
            new ArtCraftCreator('wc_xlsx', $this->l10n->t('Spreadsheet (GridCraft)'), 'xlsx', self::XLSX),
            new ArtCraftCreator('wc_pptx', $this->l10n->t('Presentation (DeckCraft)'), 'pptx', self::PPTX),
            new ArtCraftCreator('wc_pdf', $this->l10n->t('PDF document (PdfCraft)'), 'pdf', self::PDF),
        ];
    }

    public function isSecure(): bool {
        return false;
    }

    public function open(IToken $token): Response {
        $token->useTokenScope();
        try {
            $file = $token->getFile();
            $uid = $token->getUser();
            // Internal node path is "/<uid>/files/<relative>"; build the WebDAV URL for the editor.
            $path = $file->getPath();
            $prefix = '/' . $uid . '/files/';
            $rel = str_starts_with($path, $prefix) ? substr($path, strlen($prefix)) : ltrim($file->getInternalPath(), '/');
            $segments = array_map('rawurlencode', explode('/', $rel));
            $dav = '/remote.php/dav/files/' . rawurlencode($uid) . '/' . implode('/', $segments);
            $display = $this->userManager->get($uid)?->getDisplayName() ?? $uid;

            Util::addScript('wordcraft', 'wordcraft-directedit');
            return new TemplateResponse('wordcraft', 'directedit', [
                'src' => $dav,
                'name' => $file->getName(),
                'mime' => $file->getMimeType(),
                'user' => $display,
            ], 'base');
        } catch (\Throwable $e) {
            return new NotFoundResponse();
        }
    }
}
