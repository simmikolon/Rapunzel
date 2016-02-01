//
//  RPResourceLoadableType.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

protocol RPResourceLoadableType: class {

    static var resourcesNeedLoading: Bool { get }
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ())
    static func purgeResources()
}
