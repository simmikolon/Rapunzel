//
//  RPLeftBranchPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum RPLeftBranchPlatformAnimationName: String {
    
    case Normal = "RPBranchPlatformLeftNormal"
    case JumpingOn = "RPBranchPlatformLeftJumpingOn"
    case JumpingOff = "RPBranchPlatformLeftJumpingOff"
    case BottomHit = "RPBranchPlatformLeftBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

class RPLeftBranchPlatformEntity: RPPlatformEntity, RPResourceLoadableType {
    
    static var animations: [String: RPAnimation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = RPLeftBranchPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
        
        //let debugComponent = RPDebugOutputComponent(withEntity: self, andName: "RPBranchPlatform")
        //self.addComponent(debugComponent)
    }
}

extension RPLeftBranchPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(RPLeftBranchPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            animations[RPPlatformAnimationName.Normal.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[0])
            animations[RPPlatformAnimationName.JumpingOn.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[1])
            animations[RPPlatformAnimationName.JumpingOff.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[2])
            animations[RPPlatformAnimationName.BottomHit.rawValue] = RPAnimationComponent.animationsFromAtlas(atlases[3])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
    
}

