<?php

declare(strict_types=1);

namespace OCA\WordCraft\Listener;

use OCA\WordCraft\AppInfo\Application;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/** @template-implements IEventListener<Event> */
class LoadScriptListener implements IEventListener {
    public function handle(Event $event): void {
        Util::addInitScript(Application::APP_ID, 'wordcraft-main');
    }
}
