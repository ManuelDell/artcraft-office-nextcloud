<?php

declare(strict_types=1);

namespace OCA\WordCraft\DirectEditing;

use OCP\DirectEditing\ACreateEmpty;
use OCP\Files\File;

/** Creates a new, empty document of the given type from the bundled blank template. */
class ArtCraftCreator extends ACreateEmpty {
    public function __construct(
        private string $id,
        private string $name,
        private string $ext,
        private string $mime,
    ) {
    }

    public function getId(): string {
        return $this->id;
    }

    public function getName(): string {
        return $this->name;
    }

    public function getExtension(): string {
        return $this->ext;
    }

    public function getMimetype(): string {
        return $this->mime;
    }

    public function create(File $file, ?string $creatorId = null, ?string $templateId = null): void {
        $b64 = @file_get_contents(__DIR__ . '/../../src/blank-' . $this->ext . '.b64');
        if ($b64 === false) {
            return;
        }
        $bytes = base64_decode(trim($b64), true);
        if ($bytes !== false && $bytes !== '') {
            $file->putContent($bytes);
        }
    }
}
