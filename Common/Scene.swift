//
//  Scene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

class Scene: SKScene, InputManagerDelegate, InputSourceGameStateDelegate {
    
    weak var sceneManager: SceneManager!
    
    override func didMove(to view: SKView) {
        super.didMove(to: view)
        sceneManager.inputManager.delegate = self
    }
    
    // MARK: GameInputDelegate
    
    func inputManagerDidUpdateControlInputSources(_ inputManager: InputManager) {

    }
    
    func inputSourceDidToggleResumeState(_ controlInputSource: InputSource) {
        
    }
    
    func inputSourceDidTogglePauseState(_ controlInputSource: InputSource) {
        
    }
    
    func inputSourceDidSelect(_ controlInputSource: InputSource) {
        
    }
    
    func inputSource(_ controlInputSource: InputSource, didSpecifyDirection: ControlInputDirection) {
        
    }

}
