<?php

declare(strict_types=1);

namespace OCA\WordCraft\AppInfo;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCA\WordCraft\Listener\LoadScriptListener;
use OCA\WordCraft\Listener\RegisterDirectEditorListener;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\DirectEditing\RegisterDirectEditorEvent;

class Application extends App implements IBootstrap {
    public const APP_ID = 'wordcraft';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {
        // Load the file-action script only inside the Files app.
        $context->registerEventListener(LoadAdditionalScriptsEvent::class, LoadScriptListener::class);
        // Register ArtCraft as a Nextcloud editor (DirectEditing) for clients + "Open with".
        $context->registerEventListener(RegisterDirectEditorEvent::class, RegisterDirectEditorListener::class);
    }

    public function boot(IBootContext $context): void {
    }
}
