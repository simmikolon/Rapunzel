//
//  RPGameSceneCreateLevelLayerState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class RPGameSceneCreateLevelEntityState: RPGameSceneState {

    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        createLevelEntity()
    }
    
    func createLevelEntity() {
        
        gameScene.levelEntity = RPDemoLevelEntity()
        gameScene.addChild(gameScene.levelEntity.renderComponent.node)
    }
}
