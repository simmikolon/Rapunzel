//
//  MenuBetaScene.swift
//  Rapunzel
//
//  Created by Simon Kemper on 19.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class MenuBetaScene: Scene {

    override func didMove(to view: SKView) {
        super.didMove(to: view)
        //addTouchInputToScene()
        for inputSource in sceneManager.inputManager.controlInputSources {
            inputSource.gameStateDelegate = self
        }
    }
    
    override func inputSourceDidSelect(_ controlInputSource: InputSource) {
        super.inputSourceDidSelect(controlInputSource)
        sceneManager.transitionToSceneWithSceneIdentifier(SceneManager.SceneIdentifier.nextLevel)
    }
    #if os(iOS)
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        sceneManager.transitionToSceneWithSceneIdentifier(SceneManager.SceneIdentifier.nextLevel)
    }
    #endif
}
