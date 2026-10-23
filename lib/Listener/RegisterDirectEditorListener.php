<?php

declare(strict_types=1);

namespace OCA\WordCraft\Listener;

use OCA\WordCraft\DirectEditing\ArtCraftEditor;
use OCP\DirectEditing\RegisterDirectEditorEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;

/** @template-implements IEventListener<Event> */
class RegisterDirectEditorListener implements IEventListener {
    public function __construct(private ArtCraftEditor $editor) {
    }

    public function handle(Event $event): void {
        if (!$event instanceof RegisterDirectEditorEvent) {
            return;
        }
        $event->register($this->editor);
    }
}
