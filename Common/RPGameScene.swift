//
//  RPGameScene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPGameSceneSettings {
    static let width: CGFloat = 768
    static let height: CGFloat = 1364
    static let SmoothingFactor: CGFloat = 4.0
}

class RPGameScene: RPScene {
    
    // MARK: - Scene Managing Components
    
    let entityManager = RPEntityManager()
    let dataSource: RPLevelDataSource = RPDemoLevelDataSource()
    let contactDelegate = RPPhysicsWorldContactDelegate()
    
    lazy var inputManager: RPInputManager = {
        let inputManager = RPInputManager(withEntityManager: self.entityManager)
        return inputManager
    }()
    
    lazy var stateMachine: GKStateMachine = {
        return GKStateMachine(states: [
            RPGameSceneInitState(withGameScene: self),
            RPGameSceneDidMoveToViewState(withGameScene: self),
            RPGameSceneResourceLoadingState(withGameScene: self),
            RPGameSceneFinishLoadingResourcesState(withGameScene: self),
            RPGameSceneCreateLevelEntityState(withGameScene: self),
            RPGameScenePlayingState(withGameScene: self),
            RPGameScenePauseState(withGameScene: self)
        ])
    }()
    
    lazy var patternManager: RPPatternManager = {
        
        guard let playerLayerEntity = self.entityManager.entity(withName: "RPPlayerLayerEntity") as? RPLayerEntity else {
            fatalError()
        }
        
        let patternManager = RPPatternManager(withLayerEntity: playerLayerEntity,
                                              pattern: self.dataSource.demoPattern(),
                                              delegate: self.entityManager)
        
        return patternManager
    }()
    
    // MARK: View Callbacks
    
    override func didMoveToView(view: SKView) {
        super.didMoveToView(view)
        stateMachine.enterState(RPGameSceneDidMoveToViewState.self)
    }
    
    // MARK: - Lifecycle
    
    private var lastUpdateTimeInterval: NSTimeInterval = 0
    private let maximumUpdateDeltaTime: NSTimeInterval = 1.0 / 60.0
    
    override func update(currentTime: NSTimeInterval) {
        super.update(currentTime)
        guard view != nil else { return }
        stateMachine.updateWithDeltaTime(deltaTime(currentTime))
    }

    private func deltaTime(currentTime: NSTimeInterval) -> NSTimeInterval {
        var deltaTime = currentTime - lastUpdateTimeInterval
        deltaTime = deltaTime > maximumUpdateDeltaTime ? maximumUpdateDeltaTime : deltaTime
        lastUpdateTimeInterval = currentTime
        return deltaTime
    }
    
    // MARK: - Deinitialisation
    
    deinit {
        print("Deinit: RPGameScene")
    }
}
