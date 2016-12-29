/*
    Copyright (C) 2015 Apple Inc. All Rights Reserved.
    See LICENSE.txt for this sample’s licensing information
    
    Abstract:
    An extension of `BaseScene` to provide OS X platform specific functionality. This file is only included in the OS X target.
*/

import Cocoa

/*
    Extend `BaseScene` to forward events from the scene to a platform-specific
    control input source. On OS X, this is a `KeyboardControlInputSource`.
*/
extension Scene {
    // MARK: Properties
    
    var keyboardControlInputSource: KeyboardInputSource {
        return sceneManager.inputManager.nativeControlInputSource as! KeyboardInputSource
    }
    
    // MARK: NSResponder

    override func keyDown(with event: NSEvent) {
        guard let characters = event.charactersIgnoringModifiers?.characters else { return }

        for character in characters {
            keyboardControlInputSource.handleKeyDownForCharacter(character)
        }
    }
    
    override func keyUp(with event: NSEvent) {
        guard let characters = event.charactersIgnoringModifiers?.characters else { return }
        
        for character in characters {
            keyboardControlInputSource.handleKeyUpForCharacter(character)
        }
    }
}
